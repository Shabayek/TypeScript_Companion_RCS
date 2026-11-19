import { describe, expect, it } from 'vitest';
import {
  ALL_LESSONS,
  MODULES,
  blockingLesson,
  courseStats,
  isLessonUnlocked,
  moduleOfLesson,
  moduleStats,
  nextLessonId,
  previousLessonId,
} from '../src/content/curriculum';
import { defaultState, type ProgressState } from '../src/storage/types';
import { badgesForLesson } from '../src/storage/badges';

function stateWithCompleted(ids: readonly string[], badges: readonly string[] = []): ProgressState {
  const state = defaultState(1000);
  state.badges = [...badges];
  for (const id of ids) {
    state.lessons[id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 0 };
  }
  return state;
}

const first = ALL_LESSONS[0];
const second = ALL_LESSONS[1];

if (!first || !second) throw new Error('The course needs at least two lessons for these tests.');

describe('course order', () => {
  it('registers every lesson exactly once, in module order', () => {
    const ids = ALL_LESSONS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(MODULES[0]?.lessonIds[0]);
    expect(ALL_LESSONS).toHaveLength(
      MODULES.reduce((total, module) => total + module.lessonIds.length, 0),
    );
  });

  it('can name the lesson before and after another', () => {
    expect(previousLessonId(first.id)).toBeUndefined();
    expect(nextLessonId(first.id)).toBe(second.id);
    expect(previousLessonId(second.id)).toBe(first.id);
    expect(nextLessonId(ALL_LESSONS[ALL_LESSONS.length - 1]?.id ?? '')).toBeUndefined();
  });

  it('finds the module that owns a lesson', () => {
    expect(moduleOfLesson(first.id)?.id).toBe(first.moduleId);
    expect(moduleOfLesson('not-a-lesson')).toBeUndefined();
  });
});

describe('unlocking', () => {
  it('opens the first lesson and holds the second until the first is finished', () => {
    const empty = defaultState(1);
    expect(isLessonUnlocked(first.id, empty)).toBe(true);
    expect(isLessonUnlocked(second.id, empty)).toBe(false);
    expect(blockingLesson(second.id, empty)?.id).toBe(first.id);
  });

  it('opens the next lesson once the previous one is complete', () => {
    const state = stateWithCompleted([first.id]);
    expect(isLessonUnlocked(second.id, state)).toBe(true);
    expect(blockingLesson(second.id, state)).toBeUndefined();
  });

  it('does not unlock a lesson whose explicit prerequisite is missing', () => {
    const lesson = ALL_LESSONS.find((item) => (item.prereqs?.length ?? 0) > 0);
    if (!lesson) return;
    const state = stateWithCompleted([first.id]);
    expect(isLessonUnlocked(lesson.id, state)).toBe(false);
    expect(blockingLesson(lesson.id, state)?.id).toBe(lesson.prereqs?.[0]);
  });

  it('keeps a lesson the learner worked in open when a new lesson is added before it', () => {
    // The loops lesson arrived after learners had finished the objects lesson.
    const loops = ALL_LESSONS.findIndex((lesson) => lesson.id === 'm03-l05-loops');
    const after = ALL_LESSONS[loops + 1];
    if (!after) throw new Error('loops is not followed by a lesson');
    const state = defaultState();
    for (const lesson of ALL_LESSONS.slice(0, loops)) state.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
    state.lessons[after.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };

    expect(isLessonUnlocked('m03-l05-loops', state)).toBe(true); // the new lesson is next
    expect(isLessonUnlocked(after.id, state)).toBe(true); // still open, although loops is not finished
  });

  it('does not unlock a lesson that was only opened while locked', () => {
    const state = defaultState();
    const third = ALL_LESSONS[2];
    if (!third) throw new Error('need three lessons');
    state.lessons[third.id] = { status: 'started', stepIndex: 0, steps: {}, timeMs: 0 };
    expect(isLessonUnlocked(third.id, state)).toBe(false);
  });

  it('never unlocks an unknown lesson', () => {
    expect(isLessonUnlocked('missing', defaultState(1))).toBe(false);
    expect(blockingLesson('missing', defaultState(1))).toBeUndefined();
  });
});

describe('badges', () => {
  it('awards first steps once, with the first completion', () => {
    expect(badgesForLesson(first.id, defaultState(1))).toContain('first-steps');
    expect(badgesForLesson(first.id, stateWithCompleted([], ['first-steps']))).not.toContain(
      'first-steps',
    );
  });

  it('awards a module badge when its last lesson is finished', () => {
    const module = MODULES[0];
    if (!module) return;
    const rest = module.lessonIds.slice(0, -1);
    const last = module.lessonIds[module.lessonIds.length - 1];
    if (!last) return;

    const state = stateWithCompleted(rest, ['first-steps']);
    expect(badgesForLesson(last, state)).toContain(`module:${module.id}`);
    expect(badgesForLesson(last, state)).not.toContain('course-complete');
  });

  it('awards course complete only when every lesson is done', () => {
    const allButLast = ALL_LESSONS.slice(0, -1).map((lesson) => lesson.id);
    const last = ALL_LESSONS[ALL_LESSONS.length - 1];
    if (!last) return;

    const almost = stateWithCompleted(allButLast, ['first-steps', 'module:m07']);
    const earned = badgesForLesson(last.id, almost);
    expect(earned).toContain('course-complete');
  });

  it('returns nothing for an unknown lesson', () => {
    expect(badgesForLesson('missing', defaultState(1))).toEqual([]);
  });
});

describe('statistics', () => {
  it('counts solved and practised steps separately', () => {
    const [solvedStep, practicedStep] = first.steps;
    if (!solvedStep || !practicedStep) return;
    const state = stateWithCompleted([first.id]);
    state.lessons[first.id] = {
      status: 'completed',
      stepIndex: 0,
      steps: {
        [solvedStep.id]: { solved: true, practiced: false, attempts: 1, revealed: false },
        [practicedStep.id]: { solved: false, practiced: true, attempts: 2, revealed: true },
      },
      timeMs: 0,
    };

    const stats = courseStats(state);
    expect(stats.completed).toBe(1);
    expect(stats.total).toBe(ALL_LESSONS.length);
    expect(stats.solved).toBe(1);
    expect(stats.practiced).toBe(1);
  });

  it('reports a module ratio out of its own lessons', () => {
    const module = MODULES[0];
    if (!module) return;
    const state = stateWithCompleted(module.lessonIds.slice(0, 2));
    const stats = moduleStats(module.id, state);
    expect(stats).toEqual({ total: module.lessonIds.length, completed: 2, ratio: 2 / module.lessonIds.length });
    expect(moduleStats('missing', state)).toEqual({ total: 0, completed: 0, ratio: 0 });
  });
});
