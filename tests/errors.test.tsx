import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// One screen that always crashes while rendering.
vi.mock('../src/features/progress/ProgressPage', () => ({
  ProgressPage: () => {
    throw new Error('progress screen exploded');
  },
}));

import { AppRoutes } from '../src/routes';
import { ErrorBoundary } from '../src/app/ErrorBoundary';
import { __setStateForTests } from '../src/storage/store';
import { defaultState } from '../src/storage/types';

function renderAppAt(path: string) {
  const state = defaultState(1);
  state.profile.onboarded = true;
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('crash containment', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the header and navigation when one screen crashes, and recovers on navigation', async () => {
    renderAppAt('/progress');

    expect(screen.getByRole('heading', { name: 'This screen hit a problem' })).toBeInTheDocument();
    expect(screen.queryByText('Something came loose here')).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Journey' }));
    expect(await screen.findByRole('heading', { name: 'One small step at a time.' })).toBeInTheDocument();
    expect(screen.queryByText('This screen hit a problem')).not.toBeInTheDocument();
  });

  it('shows one calm toast for an error nothing else caught', async () => {
    renderAppAt('/');

    act(() => {
      window.dispatchEvent(new ErrorEvent('error', { message: 'handler failed', error: new Error('handler failed') }));
    });
    expect(await screen.findByText(/Something didn’t work just then/)).toBeInTheDocument();

    // A second error in quick succession does not stack another toast.
    act(() => {
      const rejection = new Event('unhandledrejection') as Event & { reason?: unknown };
      rejection.reason = new Error('promise failed');
      window.dispatchEvent(rejection);
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(screen.getAllByText(/Something didn’t work just then/)).toHaveLength(1);
  });

  it('ignores the harmless ResizeObserver notice', async () => {
    renderAppAt('/');
    act(() => {
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.' }),
      );
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(screen.queryByText(/Something didn’t work just then/)).not.toBeInTheDocument();
  });

  it('does not also toast an error a boundary has shown (React re-dispatches those in dev builds)', async () => {
    renderAppAt('/progress'); // the mocked Progress screen throws while rendering
    expect(screen.getByRole('heading', { name: 'This screen hit a problem' })).toBeInTheDocument();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(screen.queryByText(/Something didn’t work just then/)).not.toBeInTheDocument();
  });
});

describe('last-resort error boundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('goes back to the journey without a reload, and renders the app again', async () => {
    let broken = true;
    function Shell() {
      if (broken) throw new Error('shell exploded');
      return <p>app is back</p>;
    }
    window.location.hash = '#/learn/somewhere';
    render(
      <ErrorBoundary>
        <Shell />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something came loose here')).toBeInTheDocument();
    expect(screen.getByText('Technical details')).toBeInTheDocument();

    broken = false;
    await userEvent.click(screen.getByRole('button', { name: 'Back to the journey' }));
    expect(window.location.hash).toBe('#/');
    expect(screen.getByText('app is back')).toBeInTheDocument();
  });
});
