import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import type { CheckStep, Lesson } from '../src/content/schema';
import { AppRoutes } from '../src/routes';
import { migrate, readImport, recordAttempt, toEnvelope } from '../src/storage/model';
import {
  INTERVAL_DAYS,
  SESSION_SIZE,
  dueAt,
  dueKeys,
  recordReview,
  reviewKey,
  scheduleFromLesson,
  seedReviews,
  weakestKeys,
} from '../src/storage/review';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { SCHEMA_VERSION, defaultState, type ProgressState } from '../src/storage/types';
import { loadSession, practiceSummary, sessionKeys } from '../src/features/review/queue';

const NOON = new Date(2026, 2, 10, 12, 0, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;
const midnightAfter = (days: number) => new Date(2026, 2, 10 + days, 0, 0, 0).getTime();

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

/** The first lesson with a single-answer multiple-choice step. */
function checkStep(): { lesson: Lesson; step: CheckStep } {
  for (const lesson of ALL_LESSONS) {
    const step = lesson.steps.find((item): item is CheckStep => item.kind === 'check' && !item.multi);
    if (step) return { lesson, step };
  }
  throw new Error('no check step');
}

describe('scheduling', () => {
  it('is due now in box 0, and at the start of a later day otherwise', () => {
    expect(dueAt(0, NOON)).toBe(NOON);
    expect(dueAt(1, NOON)).toBe(midnightAfter(1));
    expect(dueAt(5, NOON)).toBe(midnightAfter(INTERVAL_DAYS[5]));
  });

  it('makes a card from the first good answer in a lesson, by how many tries it took', () => {
    const key = 'l:s';
    const first = scheduleFromLesson(defaultState(1), key, { correct: true, revealed: false, attempts: 1 }, NOON);
    expect(first.reviews[key]).toMatchObject({ box: 2, due: midnightAfter(3) });
    const second = scheduleFromLesson(defaultState(1), key, { correct: true, revealed: false, attempts: 2 }, NOON);
    expect(second.reviews[key]?.box).toBe(1);
    const many = scheduleFromLesson(defaultState(1), key, { correct: true, revealed: false, attempts: 4 }, NOON);
    expect(many.reviews[key]).toMatchObject({ box: 0, due: NOON });
  });

  it('ignores wrong answers and later good ones, but opening the answer always means "soon"', () => {
    const key = 'l:s';
    const wrong = scheduleFromLesson(defaultState(1), key, { correct: false, revealed: false, attempts: 1 }, NOON);
    expect(wrong.reviews[key]).toBeUndefined();
    const made = scheduleFromLesson(defaultState(1), key, { correct: true, revealed: false, attempts: 1 }, NOON);
    const again = scheduleFromLesson(made, key, { correct: true, revealed: false, attempts: 5 }, NOON + DAY);
    expect(again.reviews[key]).toEqual(made.reviews[key]);
    const revealed = scheduleFromLesson(made, key, { correct: true, revealed: true, attempts: 6 }, NOON + DAY);
    expect(revealed.reviews[key]).toMatchObject({ box: 0, due: NOON + DAY });
  });

  it('recordAttempt schedules graded steps as it records them', () => {
    const state = recordAttempt(defaultState(1), 'lesson', 'step', { correct: true, revealed: false }, NOON);
    expect(state.reviews[reviewKey('lesson', 'step')]?.box).toBe(2);
    expect(state.lessons.lesson?.steps.step?.solved).toBe(true);
  });

  it('moves up a box when remembered, holds when it took a retry, and resets when forgotten', () => {
    const key = 'l:s';
    let state = scheduleFromLesson(defaultState(1), key, { correct: true, revealed: false, attempts: 2 }, NOON);
    state = recordReview(state, key, 'remembered', NOON);
    expect(state.reviews[key]).toMatchObject({ box: 2, due: midnightAfter(3), reviews: 1, lapses: 0 });
    state = recordReview(state, key, 'struggled', NOON);
    expect(state.reviews[key]?.box).toBe(2);
    state = recordReview(state, key, 'forgot', NOON);
    expect(state.reviews[key]).toMatchObject({ box: 0, due: NOON, reviews: 3, lapses: 1 });
    state = recordReview(state, key, 'struggled', NOON);
    expect(state.reviews[key]?.box).toBe(1);
    for (let i = 0; i < 10; i += 1) state = recordReview(state, key, 'remembered', NOON);
    expect(state.reviews[key]?.box).toBe(INTERVAL_DAYS.length - 1);
  });

  it('lists due cards most overdue first, and the weakest for extra practice', () => {
    const state = defaultState(1);
    state.reviews = {
      'a:1': { box: 2, due: NOON - 2 * DAY, reviews: 1, lapses: 0 },
      'a:2': { box: 0, due: NOON - DAY, reviews: 0, lapses: 2 },
      'a:3': { box: 4, due: NOON + DAY, reviews: 3, lapses: 0 },
      'gone:1': { box: 0, due: NOON - 3 * DAY, reviews: 0, lapses: 0 },
    };
    expect(dueKeys(state, NOON, (key) => !key.startsWith('gone'))).toEqual(['a:1', 'a:2']);
    expect(weakestKeys(state, (key) => !key.startsWith('gone'))).toEqual(['a:2', 'a:1', 'a:3']);
  });
});

describe('saved progress', () => {
  it('gives progress from before practice existed cards for what it answered', () => {
    const old = {
      schemaVersion: 2,
      profile: { name: 'Ada', onboarded: true, createdAt: 1, experience: null },
      lessons: {
        l: {
          status: 'completed',
          stepIndex: 0,
          timeMs: 1,
          steps: {
            easy: { solved: true, practiced: false, attempts: 1, revealed: false },
            hard: { solved: false, practiced: true, attempts: 3, revealed: true },
            tried: { solved: false, practiced: false, attempts: 2, revealed: false },
          },
        },
      },
    };
    const state = migrate(old);
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Object.keys(state.reviews).sort()).toEqual(['l:easy', 'l:hard']);
    expect(state.reviews['l:easy']?.box).toBe(2);
    expect(state.reviews['l:hard']?.box).toBe(0);
    expect(seedReviews({}, NOON)).toEqual({});
  });

  it('cleans up cards from a file: bad keys, numbers and boxes', () => {
    const state = migrate({
      reviews: {
        'l:s': { box: 99, due: NOON, reviews: 1.5, lapses: -2 },
        'nokey': { box: 1, due: NOON },
        '__proto__:x': { box: 1, due: NOON },
        'l:nodue': { box: 1 },
        'l:bad': 'x',
      },
    });
    expect(state.reviews).toEqual({ 'l:s': { box: 5, due: NOON, reviews: 1, lapses: 0 } });
    expect(Object.getPrototypeOf(state.reviews)).toBe(Object.prototype);
  });

  it('travels in an export and comes back on import', () => {
    const state = learner((draft) => {
      draft.reviews['l:s'] = { box: 3, due: NOON, reviews: 4, lapses: 1 };
    });
    const back = readImport(JSON.stringify(toEnvelope(state))).state;
    expect(back.reviews).toEqual(state.reviews);
  });

  it('keeps an empty practice list as empty (does not re-seed)', () => {
    const state = migrate({
      reviews: {},
      lessons: { l: { status: 'completed', stepIndex: 0, timeMs: 1, steps: { a: { solved: true, practiced: false, attempts: 1, revealed: false } } } },
    });
    expect(state.reviews).toEqual({});
  });
});

describe('practice queue', () => {
  it('skips cards for steps the course no longer has, and caps a session', async () => {
    const { lesson, step } = checkStep();
    const state = learner((draft) => {
      draft.reviews[reviewKey(lesson.id, step.id)] = { box: 0, due: 1, reviews: 0, lapses: 0 };
      draft.reviews['removed-lesson:step'] = { box: 0, due: 1, reviews: 0, lapses: 0 };
      // A reading step is not practice material.
      const read = lesson.steps.find((item) => item.kind === 'read');
      if (read) draft.reviews[reviewKey(lesson.id, read.id)] = { box: 0, due: 1, reviews: 0, lapses: 0 };
    });
    expect(practiceSummary(state).due).toBe(1);
    expect((await loadSession(state, 'due', 'en')).map((item) => item.step.id)).toEqual([step.id]);

    const many = learner((draft) => {
      for (const item of ALL_LESSONS) {
        for (const graded of item.steps.filter((candidate) => candidate.kind === 'check')) {
          draft.reviews[reviewKey(item.id, graded.id)] = { box: 0, due: 1, reviews: 0, lapses: 0 };
        }
      }
    });
    expect(sessionKeys(many, 'due')).toHaveLength(SESSION_SIZE);
    expect(await loadSession(many, 'due', 'en')).toHaveLength(SESSION_SIZE);
  });
});

describe('practice screen', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  const renderAt = (path: string, state: ProgressState) => {
    __setStateForTests(state);
    return render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );
  };

  it('says how practice fills up when there is nothing yet', () => {
    renderAt('/practice', learner());
    expect(screen.getByRole('heading', { level: 1, name: 'Nothing due right now' })).toBeInTheDocument();
    expect(screen.getByText(/Practice fills up as you go/)).toBeInTheDocument();
  });

  it('practises a due step and moves it up a box when remembered', async () => {
    const user = userEvent.setup();
    const { lesson, step } = checkStep();
    const key = reviewKey(lesson.id, step.id);
    renderAt('/practice', learner((draft) => {
      draft.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
      draft.reviews[key] = { box: 1, due: 1, reviews: 0, lapses: 0 };
    }));

    expect(screen.getByRole('heading', { level: 1, name: '1 step ready to practise' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start practice' }));
    expect(screen.getByText(/^From/)).toHaveTextContent(lesson.title.explorer);

    const right = step.choices.find((choice) => choice.correct);
    if (!right) throw new Error('no right choice');
    const option = screen.getAllByRole('button').find((button) => button.getAttribute('aria-pressed') !== null && button.textContent?.includes(right.text.base.replace(/[`*]/g, '').slice(0, 12)));
    if (!option) throw new Error('option not found');
    await user.click(option);
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByText(/^Remembered\./)).toHaveAttribute('role', 'status');
    expect(useJourney.getState().state.reviews[key]).toMatchObject({ box: 2, reviews: 1 });
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByRole('heading', { name: 'Practice done' })).toBeInTheDocument();
  });

  it('sends a step back to the start when the answer is opened', async () => {
    const user = userEvent.setup();
    const { lesson, step } = checkStep();
    const key = reviewKey(lesson.id, step.id);
    renderAt('/practice', learner((draft) => {
      draft.reviews[key] = { box: 3, due: 1, reviews: 2, lapses: 0 };
    }));

    await user.click(screen.getByRole('button', { name: 'Start practice' }));
    await user.click(screen.getByRole('button', { name: /^(Hint|Stuck\?)$/ }));
    await user.click(screen.getByRole('button', { name: 'Show me the answer' }));

    expect(useJourney.getState().state.reviews[key]).toMatchObject({ box: 0, lapses: 1 });
    expect(screen.getByText('Answer')).toBeInTheDocument();
  });

  it('offers the hardest steps when nothing is due, and the home screen counts what is due', async () => {
    const user = userEvent.setup();
    const { lesson, step } = checkStep();
    const later = Date.now() + 3 * DAY;
    const { unmount } = renderAt('/practice', learner((draft) => {
      draft.reviews[reviewKey(lesson.id, step.id)] = { box: 2, due: later, reviews: 1, lapses: 0 };
    }));
    expect(screen.getByText(/The next step is due in 3 days/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Practise the hardest ones' }));
    expect(screen.getByText('Extra practice')).toBeInTheDocument();
    unmount();

    renderAt('/', learner((draft) => {
      draft.reviews[reviewKey(lesson.id, step.id)] = { box: 0, due: 1, reviews: 0, lapses: 0 };
    }));
    expect(screen.getByRole('heading', { name: '1 step ready to practise' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Practise now' })).toHaveAttribute('href', '/practice');
  });
});
