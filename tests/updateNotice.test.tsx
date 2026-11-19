import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/platform/capabilities', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/platform/capabilities')>()),
  reloadApp: vi.fn(),
}));

import { reloadApp } from '../src/platform/capabilities';
import { AppRoutes } from '../src/routes';
import { watchRegistration } from '../src/app/registerServiceWorker';
import { __setStateForTests } from '../src/storage/store';
import { defaultState } from '../src/storage/types';

class FakeWorker extends EventTarget {
  state: ServiceWorkerState = 'installed';
  postMessage = vi.fn();
}

function renderApp() {
  const state = defaultState(1);
  state.profile.onboarded = true;
  __setStateForTests(state);
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

function announceWaitingUpdate(worker: FakeWorker) {
  const container = Object.assign(new EventTarget(), { controller: {} });
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  const registration = Object.assign(new EventTarget(), { waiting: worker, installing: null });
  act(() => {
    watchRegistration(
      registration as unknown as ServiceWorkerRegistration,
      container as unknown as ServiceWorkerContainer,
    );
  });
  return container;
}

describe('new version notice', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers the update without reloading, and can be put off', async () => {
    renderApp();
    expect(screen.queryByText('A new version of the app is ready.')).not.toBeInTheDocument();

    announceWaitingUpdate(new FakeWorker());
    expect(screen.getByText('A new version of the app is ready.')).toBeInTheDocument();
    expect(reloadApp).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText('A new version of the app is ready.')).not.toBeInTheDocument();
  });

  it('switches to the new version when the learner chooses Reload', async () => {
    renderApp();
    const worker = new FakeWorker();
    const container = announceWaitingUpdate(worker);

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    container.dispatchEvent(new Event('controllerchange'));
    expect(reloadApp).toHaveBeenCalledTimes(1);
  });
});
