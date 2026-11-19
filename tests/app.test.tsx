import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/routes';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { decodeState, encodeState } from '../src/storage/model';
import { STORAGE_KEY, defaultState, type ProgressState } from '../src/storage/types';

/**
 * The app shell and lesson player together, from a cold start, the way a
 * reload (or Android restoring a killed WebView) runs them.
 */
function lessonAt(index: number) {
  const lesson = ALL_LESSONS[index];
  if (!lesson) throw new Error('These tests need four lessons.');
  return lesson;
}
const [l1, l2, l3, l4] = [lessonAt(0), lessonAt(1), lessonAt(2), lessonAt(3)];

function learnerMidwayThroughLesson4(): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  for (const lesson of [l1, l2, l3]) {
    state.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1, completedAt: 1 };
  }
  state.lessons[l4.id] = { status: 'started', stepIndex: 3, steps: {}, timeMs: 0 };
  state.badges = ['first-steps'];
  return state;
}

function coldStartAt(path: string) {
  __setStateForTests(defaultState(1));
  useJourney.setState({ hydrated: false });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

const onDisk = () => decodeState(window.localStorage.getItem(STORAGE_KEY));

describe('app start-up', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps saved progress when the app starts on a lesson page', async () => {
    window.localStorage.setItem(STORAGE_KEY, encodeState(learnerMidwayThroughLesson4()));

    coldStartAt(`/learn/${l4.id}`);
    await screen.findByText(`Step 4 of ${l4.steps.length}`);
    // Longer than the save debounce: a wrongly queued default state would land now.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const saved = onDisk();
    expect(saved.profile).toMatchObject({ name: 'Ada', onboarded: true });
    expect(saved.badges).toEqual(['first-steps']);
    for (const lesson of [l1, l2, l3]) expect(saved.lessons[lesson.id]?.status).toBe('completed');
    expect(saved.lessons[l4.id]?.stepIndex).toBe(3);
  });

  it('renders no screen until saved progress has been read', () => {
    window.localStorage.setItem(STORAGE_KEY, encodeState(learnerMidwayThroughLesson4()));

    coldStartAt(`/learn/${l4.id}`);

    expect(screen.getByText('Loading your progress…')).toBeInTheDocument();
    expect(screen.queryByText(/Step \d+ of/)).not.toBeInTheDocument();
  });

  it('opens a lesson with an out-of-range saved step at a real step', async () => {
    const state = learnerMidwayThroughLesson4();
    state.lessons[l4.id] = { status: 'started', stepIndex: 999, steps: {}, timeMs: 0 };
    window.localStorage.setItem(STORAGE_KEY, encodeState(state));

    coldStartAt(`/learn/${l4.id}`);

    expect(
      await screen.findByText(`Step ${l4.steps.length} of ${l4.steps.length}`),
    ).toBeInTheDocument();
  });
});
