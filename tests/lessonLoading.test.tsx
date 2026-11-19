import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MODULES } from '../src/content/curriculum';
import { __resetLoaderForTests, __setModuleLoaderForTests, loadModule } from '../src/content/loader';
import { FULL_COURSE } from '../src/content/fullCourse';
import { AppRoutes } from '../src/routes';
import { __setStateForTests } from '../src/storage/store';
import { defaultState } from '../src/storage/types';

const first = FULL_COURSE[0]!;

function renderLesson() {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[`/learn/${first.id}`]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('opening a lesson whose content is not loaded yet', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    __resetLoaderForTests();
    // Leave the cache warm for any test that runs after this file's tests.
    await Promise.all(MODULES.map((module) => loadModule(module.id, 'en')));
  });

  it('shows the lesson once its module arrives', async () => {
    __resetLoaderForTests();
    renderLesson();
    expect(await screen.findByText(`Step 1 of ${first.steps.length}`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: first.title.explorer })).toBeInTheDocument();
  });

  it('explains a failed download and offers a reload, instead of crashing', async () => {
    __resetLoaderForTests();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    __setModuleLoaderForTests(first.moduleId, () => Promise.reject(new Error('chunk failed')));
    renderLesson();
    expect(await screen.findByRole('heading', { name: 'This lesson didn’t load' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload the app' })).toBeInTheDocument();
  });
});
