import { ALL_LESSONS, isLessonCompleted, lessonIndex } from '../content/curriculum';
import type { LessonMeta } from '../content/schema';
import type { ProgressState } from './types';

/** The furthest lesson (in course order) the learner has finished, or -1. */
function furthestFinished(state: ProgressState): number {
  let furthest = -1;
  for (const lesson of ALL_LESSONS) {
    if (isLessonCompleted(lesson.id, state)) furthest = Math.max(furthest, lessonIndex(lesson.id));
  }
  return furthest;
}

/**
 * New lessons worth pointing out: added since the learner last looked, in a
 * part of the course they have already passed (so they might think they had
 * finished it). Lessons ahead of them need no note: they will meet them.
 */
export function lessonsAddedBehind(state: ProgressState): LessonMeta[] {
  if (!state.seenLessons) return [];
  const seen = new Set(state.seenLessons);
  const furthest = furthestFinished(state);
  return ALL_LESSONS.filter(
    (lesson) => !seen.has(lesson.id) && lessonIndex(lesson.id) < furthest && !isLessonCompleted(lesson.id, state),
  );
}

/**
 * Brings the learner's list of known lessons up to date when the app starts:
 * a new learner knows the whole course; anyone else learns silently about new
 * lessons still ahead of them. Lessons added behind them stay unseen until the
 * Home note about them is dismissed.
 */
export function reconcileSeenLessons(state: ProgressState): ProgressState {
  const all = ALL_LESSONS.map((lesson) => lesson.id);
  if (state.seenLessons === null) return { ...state, seenLessons: all };
  const behind = new Set(lessonsAddedBehind(state).map((lesson) => lesson.id));
  const next = all.filter((id) => !behind.has(id));
  const same = next.length === state.seenLessons.length && next.every((id) => state.seenLessons?.includes(id));
  return same ? state : { ...state, seenLessons: next };
}

/** After the note: every lesson is known. */
export function acknowledgeAllLessons(state: ProgressState): ProgressState {
  return { ...state, seenLessons: ALL_LESSONS.map((lesson) => lesson.id) };
}
