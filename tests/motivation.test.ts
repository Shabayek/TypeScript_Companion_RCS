import { tracksInCourse } from '../src/content/curriculum';
import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, MODULES } from '../src/content/curriculum';
import { BADGE_LIST, newlyEarned, trackCertificates } from '../src/storage/badges';
import {
  ACTIVITY_DAYS_KEPT,
  awardBadges,
  bumpCounter,
  dayKey,
  migrate,
  pruneActivity,
  recordActivity,
} from '../src/storage/model';
import {
  XP,
  daysGoalMet,
  goalToday,
  levelFor,
  levelThreshold,
  streakInfo,
  xpFromState,
} from '../src/storage/motivation';
import { celebrationsBetween, creditFor } from '../src/storage/store';
import { SCHEMA_VERSION, defaultState, type DayActivity, type LessonProgress, type ProgressState } from '../src/storage/types';

const NOON = new Date(2026, 2, 10, 12, 0, 0).getTime();
const MINUTE = 60_000;
const day = (offset: number) => dayKey(new Date(2026, 2, 10 + offset, 12));
const done = (): LessonProgress => ({ status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 });

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

/** Activity on the given day offsets (relative to NOON's day). */
function activeOn(offsets: readonly number[]): Record<string, DayActivity> {
  return Object.fromEntries(offsets.map((offset) => [day(offset), { ms: 5 * MINUTE, steps: 2 }]));
}

describe('points and levels', () => {
  it('count solved and practised steps, lessons, whole modules and practice', () => {
    const module = MODULES[0]!;
    const state = learner((draft) => {
      for (const id of module.lessonIds) draft.lessons[id] = done();
      draft.lessons[module.lessonIds[0]!]!.steps = {
        a: { solved: true, practiced: false, attempts: 1, revealed: false },
        b: { solved: false, practiced: true, attempts: 2, revealed: true },
        c: { solved: false, practiced: false, attempts: 1, revealed: false },
      };
      draft.reviews['x:y'] = { box: 2, due: 1, reviews: 3, lapses: 0 };
    });
    expect(xpFromState(state)).toBe(
      module.lessonIds.length * XP.lesson + XP.solved + XP.practised + XP.module + 3 * XP.review,
    );
    expect(xpFromState(learner())).toBe(0);
  });

  it('level up at 50, 150, 300, … and report the way to the next', () => {
    expect([1, 2, 3, 4, 5].map(levelThreshold)).toEqual([0, 50, 150, 300, 500]);
    expect(levelFor(0)).toMatchObject({ level: 1, floor: 0, next: 50, progress: 0 });
    expect(levelFor(49).level).toBe(1);
    expect(levelFor(50).level).toBe(2);
    expect(levelFor(225)).toMatchObject({ level: 3, floor: 150, next: 300, progress: 0.5 });
  });
});

describe('the gentle streak', () => {
  it('is empty before any learning, with a rest day in hand', () => {
    expect(streakInfo({}, NOON)).toEqual({ current: 0, best: 0, restDays: 1, activeToday: false, returning: false });
  });

  it('counts days in a row, and today only adds, never breaks', () => {
    expect(streakInfo(activeOn([-2, -1]), NOON)).toMatchObject({ current: 2, activeToday: false });
    expect(streakInfo(activeOn([-2, -1, 0]), NOON)).toMatchObject({ current: 3, activeToday: true });
  });

  it('lets a saved rest day cover a quiet day', () => {
    const info = streakInfo(activeOn([-4, -3, -1]), NOON); // -2 was quiet
    expect(info).toMatchObject({ current: 3, restDays: 0 });
  });

  it('ends a run only when there is no rest day left, and then welcomes the learner back', () => {
    const info = streakInfo(activeOn([-6, -5]), NOON); // four quiet days since
    expect(info).toMatchObject({ current: 0, best: 2, returning: true });
    expect(streakInfo(activeOn([-6, -5, 0]), NOON)).toMatchObject({ current: 1, returning: false });
  });

  it('earns a rest day every seven days, and saves at most two', () => {
    const fortnight = activeOn(Array.from({ length: 21 }, (_, i) => i - 21));
    expect(streakInfo(fortnight, NOON)).toMatchObject({ current: 21, restDays: 2 });
  });

  it('counts a day after one answered step or a minute of learning', () => {
    expect(streakInfo({ [day(0)]: { ms: 0, steps: 1 } }, NOON).activeToday).toBe(true);
    expect(streakInfo({ [day(0)]: { ms: MINUTE, steps: 0 } }, NOON).activeToday).toBe(true);
    expect(streakInfo({ [day(0)]: { ms: 30_000, steps: 0 } }, NOON).activeToday).toBe(false);
  });
});

describe('the daily goal', () => {
  it('measures today against the chosen minutes', () => {
    const state = learner((draft) => {
      draft.settings.dailyGoal = 5;
      draft.activity = { [day(0)]: { ms: 3 * MINUTE, steps: 1 }, [day(-1)]: { ms: 7 * MINUTE, steps: 4 } };
    });
    expect(goalToday(state, NOON)).toEqual({ goalMinutes: 5, minutesToday: 3, progress: 0.6, met: false });
    expect(daysGoalMet(state)).toBe(1);
  });
});

describe('counting learning time', () => {
  it('credits short gaps in full, long reads up to two minutes, and nothing after ten', () => {
    expect(creditFor(30_000)).toBe(30_000);
    expect(creditFor(5 * MINUTE)).toBe(2 * MINUTE);
    expect(creditFor(11 * MINUTE)).toBe(0);
    expect(creditFor(-5)).toBe(0);
  });

  it('adds time and answered steps to the right day', () => {
    let state = recordActivity(learner(), NOON, 45_000, true);
    state = recordActivity(state, NOON + MINUTE, 30_000);
    expect(state.activity[day(0)]).toEqual({ ms: 75_000, steps: 1 });
  });

  it('keeps only the most recent days', () => {
    const many: Record<string, DayActivity> = {};
    for (let i = 0; i < ACTIVITY_DAYS_KEPT + 10; i += 1) many[day(-i)] = { ms: 1, steps: 1 };
    const kept = pruneActivity(many);
    expect(Object.keys(kept)).toHaveLength(ACTIVITY_DAYS_KEPT);
    expect(kept[day(0)]).toBeDefined();
    expect(kept[day(-(ACTIVITY_DAYS_KEPT + 5))]).toBeUndefined();
  });
});

describe('saved progress, version 4', () => {
  it('upgrades older progress with empty activity and counters, keeping everything else', () => {
    const old = { ...learner(), schemaVersion: 3 } as Record<string, unknown>;
    delete old.activity;
    delete old.counters;
    const upgraded = migrate(old);
    expect(upgraded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(5);
    expect(upgraded.activity).toEqual({});
    expect(upgraded.counters).toEqual({ playgroundRuns: 0, decoderLookups: 0, glossaryOpens: 0, practiceSessions: 0 });
    expect(upgraded.settings).toMatchObject({ quiet: false, dailyGoal: 10 });
  });

  it('drops anything malformed instead of trusting it', () => {
    const upgraded = migrate({
      ...learner(),
      settings: { ...learner().settings, dailyGoal: 45, quiet: 'yes' },
      activity: {
        '2026-03-10': { ms: 120_000, steps: 3 },
        'not a day': { ms: 5, steps: 1 },
        '2026-03-09': { ms: -4, steps: 1.7 },
        '2026-03-08': { ms: 1e12, steps: 1 },
        __proto__: { ms: 1, steps: 1 },
      },
      counters: { playgroundRuns: 3, decoderLookups: 'many', glossaryOpens: -1, unknown: 9 },
    });
    expect(upgraded.settings).toMatchObject({ dailyGoal: 10, quiet: false });
    expect(upgraded.activity).toEqual({
      '2026-03-10': { ms: 120_000, steps: 3 },
      '2026-03-09': { ms: 0, steps: 1 },
      '2026-03-08': { ms: 24 * 60 * MINUTE, steps: 1 },
    });
    expect(upgraded.counters).toEqual({ playgroundRuns: 3, decoderLookups: 0, glossaryOpens: 0, practiceSessions: 0 });
  });

  it('round-trips through a save', () => {
    const state = bumpCounter(recordActivity(learner(), NOON, MINUTE, true), 'playgroundRuns');
    expect(migrate(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});

describe('badges', () => {
  it('keeps the ids older progress already uses', () => {
    const ids = BADGE_LIST.map((badge) => badge.id);
    expect(ids).toContain('first-steps');
    expect(ids).toContain('course-complete');
    for (const module of MODULES) expect(ids).toContain(`module:${module.id}`);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('awards explorer badges from counters, and never twice', () => {
    const state = bumpCounter(learner(), 'playgroundRuns');
    expect(newlyEarned(state)).toContain('tinkerer');
    expect(newlyEarned(awardBadges(state, ['tinkerer']))).not.toContain('tinkerer');
  });

  it('awards skill badges from the kind of steps solved', () => {
    const predicts = ALL_LESSONS.flatMap((lesson) =>
      lesson.steps.filter((step) => step.kind === 'predict').map((step) => ({ lesson: lesson.id, step: step.id })),
    ).slice(0, 10);
    expect(predicts).toHaveLength(10);
    const state = learner((draft) => {
      for (const { lesson, step } of predicts) {
        draft.lessons[lesson] ??= { status: 'started', stepIndex: 0, steps: {}, timeMs: 1 };
        draft.lessons[lesson]!.steps[step] = { solved: true, practiced: false, attempts: 2, revealed: false };
      }
    });
    const earned = newlyEarned(state);
    expect(earned).toContain('fortune-teller');
    expect(earned).not.toContain('sharp-eye'); // second tries do not count for it
  });

  it('awards the streak and goal badges from activity', () => {
    const state = learner((draft) => {
      draft.settings.dailyGoal = 5;
      draft.activity = activeOn([-7, -6, -5, -4, -3, -2, -1]);
    });
    const earned = newlyEarned(state, NOON);
    expect(earned).toContain('steady');
    expect(earned).toContain('goal-getter');
  });

  it('gives one certificate per track, earned when every lesson in it is finished', () => {
    const none = trackCertificates(learner());
    expect(none.map((item) => item.track)).toEqual(tracksInCourse());
    expect(none[0]).toMatchObject({ earned: false, completedModules: 0 });
    const all = learner((draft) => {
      for (const lesson of ALL_LESSONS) draft.lessons[lesson.id] = { ...done(), completedAt: 5 };
    });
    expect(trackCertificates(all)[0]).toMatchObject({ earned: true, earnedAt: 5 });
  });
});

describe('celebrations', () => {
  it('names new badges, a new level, the goal reached and a streak milestone', () => {
    const before = learner((draft) => {
      draft.settings.dailyGoal = 5;
      draft.activity = { ...activeOn([-2, -1]), [day(0)]: { ms: 30_000, steps: 0 } };
    });
    const after = learner((draft) => {
      draft.settings.dailyGoal = 5;
      draft.activity = { ...activeOn([-2, -1]), [day(0)]: { ms: 6 * MINUTE, steps: 1 } };
      draft.lessons[ALL_LESSONS[0]!.id] = done();
      draft.lessons[ALL_LESSONS[1]!.id] = done();
    });
    expect(celebrationsBetween(before, after, ['first-steps'], NOON)).toEqual([
      { kind: 'badge', id: 'first-steps' },
      { kind: 'level', level: 2 },
      { kind: 'goal', minutes: 5 },
      { kind: 'streak', days: 3 },
    ]);
  });

  it('has nothing to celebrate in Quiet mode', () => {
    const after = learner((draft) => {
      draft.settings.quiet = true;
      draft.lessons[ALL_LESSONS[0]!.id] = done();
      draft.lessons[ALL_LESSONS[1]!.id] = done();
    });
    expect(celebrationsBetween(learner(), after, ['first-steps'], NOON)).toEqual([]);
  });
});
