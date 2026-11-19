import { ALL_LESSONS, MODULES, getLessonMeta, isLessonCompleted } from '../content/curriculum';
import type { CourseModule, StepKind, Track } from '../content/schema';
import { daysGoalMet, streakInfo, type StreakInfo } from './motivation';
import type { ProgressState } from './types';

/**
 * Every badge, with how far along the learner is. A badge is earned when its
 * value reaches its target, and once earned it is kept (saved in
 * `state.badges`) even if a rule later changes.
 *
 * Ids are permanent keys in saved progress: `first-steps`, `module:<id>` and
 * `course-complete` predate this file and must keep their names.
 */
export type BadgeGroup = 'milestone' | 'module' | 'skill' | 'explorer';

export const BADGE_GROUPS: readonly BadgeGroup[] = ['milestone', 'module', 'skill', 'explorer'];

export interface BadgeContext {
  streak: StreakInfo;
}

export interface BadgeDefinition {
  id: string;
  group: BadgeGroup;
  /** Decorative; the name and description carry the meaning. */
  icon: string;
  /** For module badges: the module it celebrates. */
  module?: CourseModule;
  progress: (state: ProgressState, context: BadgeContext) => { value: number; target: number };
}

function completedLessons(state: ProgressState): number {
  return ALL_LESSONS.filter((lesson) => isLessonCompleted(lesson.id, state)).length;
}

/** Graded steps solved on their own, optionally of one kind and only at the first try. */
function solvedSteps(state: ProgressState, kinds: readonly StepKind[] | null, firstTry = false): number {
  let count = 0;
  for (const [lessonId, lesson] of Object.entries(state.lessons)) {
    const meta = getLessonMeta(lessonId);
    if (!meta) continue;
    for (const [stepId, record] of Object.entries(lesson.steps)) {
      if (!record.solved || (firstTry && record.attempts !== 1)) continue;
      const kind = meta.steps.find((step) => step.id === stepId)?.kind;
      if (kind && (kinds === null || kinds.includes(kind))) count += 1;
    }
  }
  return count;
}

const count = (value: number, target: number) => ({ value: Math.min(value, target), target });

export const BADGE_LIST: readonly BadgeDefinition[] = [
  { id: 'first-steps', group: 'milestone', icon: '🌱', progress: (state) => count(completedLessons(state), 1) },
  ...MODULES.map(
    (module): BadgeDefinition => ({
      id: `module:${module.id}`,
      group: 'module',
      icon: '★',
      module,
      progress: (state) =>
        count(module.lessonIds.filter((id) => isLessonCompleted(id, state)).length, module.lessonIds.length),
    }),
  ),
  {
    id: 'course-complete',
    group: 'milestone',
    icon: '🏁',
    progress: (state) => count(completedLessons(state), ALL_LESSONS.length),
  },
  { id: 'sharp-eye', group: 'skill', icon: '🎯', progress: (state) => count(solvedSteps(state, null, true), 25) },
  { id: 'fortune-teller', group: 'skill', icon: '🔮', progress: (state) => count(solvedSteps(state, ['predict', 'predictType']), 10) },
  { id: 'bug-squasher', group: 'skill', icon: '🐞', progress: (state) => count(solvedSteps(state, ['fix']), 5) },
  { id: 'code-writer', group: 'skill', icon: '✍️', progress: (state) => count(solvedSteps(state, ['write', 'types']), 10) },
  {
    id: 'memory-keeper',
    group: 'skill',
    icon: '🧠',
    progress: (state) => count(Object.values(state.reviews).reduce((sum, card) => sum + card.reviews, 0), 25),
  },
  { id: 'steady', group: 'skill', icon: '🔥', progress: (_state, context) => count(context.streak.best, 7) },
  { id: 'goal-getter', group: 'skill', icon: '⏱️', progress: (state) => count(daysGoalMet(state), 5) },
  { id: 'tinkerer', group: 'explorer', icon: '🛠️', progress: (state) => count(state.counters.playgroundRuns, 1) },
  { id: 'decoder', group: 'explorer', icon: '🔎', progress: (state) => count(state.counters.decoderLookups, 3) },
  { id: 'word-collector', group: 'explorer', icon: '📖', progress: (state) => count(state.counters.glossaryOpens, 10) },
  { id: 'practice-round', group: 'explorer', icon: '🔁', progress: (state) => count(state.counters.practiceSessions, 1) },
  {
    id: 'type-challenger',
    group: 'explorer',
    icon: '🧩',
    progress: (state) => count(Object.values(state.arena).filter((puzzle) => puzzle.solved).length, 10),
  },
];

export const BADGE_BY_ID: ReadonlyMap<string, BadgeDefinition> = new Map(BADGE_LIST.map((badge) => [badge.id, badge]));

export function badgeContext(state: ProgressState, now = Date.now()): BadgeContext {
  return { streak: streakInfo(state.activity, now) };
}

/** Badges whose rule is met but which the learner does not have yet, in list order. */
export function newlyEarned(state: ProgressState, now = Date.now()): string[] {
  const owned = new Set(state.badges);
  const context = badgeContext(state, now);
  return BADGE_LIST.filter((badge) => {
    if (owned.has(badge.id)) return false;
    const { value, target } = badge.progress(state, context);
    return value >= target;
  }).map((badge) => badge.id);
}

/** Badges finishing a lesson would earn (computed as if it were already finished). */
export function badgesForLesson(lessonId: string, state: ProgressState, now = Date.now()): string[] {
  const after: ProgressState = {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...(state.lessons[lessonId] ?? { stepIndex: 0, steps: {}, timeMs: 0 }),
        status: 'completed',
      },
    },
  };
  return newlyEarned(after, now);
}

/* ----------------------------- certificates ----------------------- */

export interface TrackCertificate {
  track: Track;
  modules: readonly CourseModule[];
  completedModules: number;
  earned: boolean;
  /** When the last lesson of the track was finished. */
  earnedAt: number | null;
}

/** One certificate per course stage: earned when every lesson in it is finished. */
export function trackCertificates(state: ProgressState): TrackCertificate[] {
  const tracks: Track[] = [];
  for (const module of MODULES) if (!tracks.includes(module.track)) tracks.push(module.track);
  return tracks.map((track) => {
    const modules = MODULES.filter((module) => module.track === track);
    const lessonIds = modules.flatMap((module) => [...module.lessonIds]);
    const completedModules = modules.filter((module) =>
      module.lessonIds.every((id) => isLessonCompleted(id, state)),
    ).length;
    const earned = lessonIds.length > 0 && lessonIds.every((id) => isLessonCompleted(id, state));
    const times = lessonIds.map((id) => state.lessons[id]?.completedAt ?? 0);
    return { track, modules, completedModules, earned, earnedAt: earned ? Math.max(0, ...times) || null : null };
  });
}
