/**
 * Spaced practice (a Leitner box system). Every graded step the learner has
 * met becomes a card. A card sits in a box; the box sets how long until the
 * card is due again. Remembering moves it up a box, needing the answer moves
 * it back to the first one. Pure functions: the store calls them, tests pin
 * them down, and nothing here knows about lesson content.
 */
import type { ProgressState, ReviewCard } from './types';

/** Days until due, by box. Box 0 is "practise again soon": due straight away. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const TOP_BOX = INTERVAL_DAYS.length - 1;
/** Cards in one practice session, so a session stays a few minutes long. */
export const SESSION_SIZE = 8;

export const reviewKey = (lessonId: string, stepId: string): string => `${lessonId}:${stepId}`;

export function splitReviewKey(key: string): { lessonId: string; stepId: string } | null {
  const at = key.indexOf(':');
  if (at <= 0 || at === key.length - 1) return null;
  return { lessonId: key.slice(0, at), stepId: key.slice(at + 1) };
}

/** Local midnight at the start of `now`'s day. */
function startOfDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * When a card in `box` is next due. Box 0 is due now; the others at the start
 * of a later day, so "due in 1 day" means "tomorrow", whatever the hour.
 */
export function dueAt(box: number, now: number): number {
  const days = INTERVAL_DAYS[Math.min(Math.max(0, box), TOP_BOX)] ?? 0;
  if (days === 0) return now;
  const next = new Date(startOfDay(now));
  next.setDate(next.getDate() + days);
  return next.getTime();
}

export function card(box: number, now: number, previous?: ReviewCard): ReviewCard {
  return {
    box,
    due: dueAt(box, now),
    reviews: previous?.reviews ?? 0,
    lapses: previous?.lapses ?? 0,
  };
}

function withCard(state: ProgressState, key: string, next: ReviewCard): ProgressState {
  return { ...state, reviews: { ...state.reviews, [key]: next } };
}

/**
 * A graded step was answered inside a lesson. The first good answer makes a
 * card: first try → box 2 (in 3 days), second try → box 1 (tomorrow), more
 * tries → box 0 (practise soon). Opening the answer always means "soon", even
 * for a card that already exists. Wrong answers on their own change nothing.
 */
export function scheduleFromLesson(
  state: ProgressState,
  key: string,
  result: { correct: boolean; revealed: boolean; attempts: number },
  now: number,
): ProgressState {
  const existing = state.reviews[key];
  if (result.revealed) return withCard(state, key, card(0, now, existing));
  if (!result.correct || existing) return state;
  const box = result.attempts <= 1 ? 2 : result.attempts === 2 ? 1 : 0;
  return withCard(state, key, card(box, now));
}

export type ReviewOutcome = 'remembered' | 'struggled' | 'forgot';

/**
 * A card was practised. Remembered (right first time) → up a box; struggled
 * (right after a wrong try) → stays, at least box 1; forgot (opened the
 * answer) → back to box 0.
 */
export function recordReview(
  state: ProgressState,
  key: string,
  outcome: ReviewOutcome,
  now: number,
): ProgressState {
  const existing = state.reviews[key] ?? card(0, now);
  const box =
    outcome === 'remembered'
      ? Math.min(TOP_BOX, existing.box + 1)
      : outcome === 'struggled'
        ? Math.max(1, existing.box)
        : 0;
  return withCard(state, key, {
    box,
    due: dueAt(box, now),
    reviews: existing.reviews + 1,
    lapses: existing.lapses + (outcome === 'forgot' ? 1 : 0),
  });
}

/** Keys of cards due now, most overdue first. `exists` filters out removed content. */
export function dueKeys(
  state: ProgressState,
  now: number,
  exists: (key: string) => boolean = () => true,
): string[] {
  return Object.entries(state.reviews)
    .filter(([key, item]) => item.due <= now && exists(key))
    .sort(([, a], [, b]) => a.due - b.due || a.box - b.box)
    .map(([key]) => key);
}

/** For "practise anyway" when nothing is due: lowest box first, then soonest due. */
export function weakestKeys(
  state: ProgressState,
  exists: (key: string) => boolean = () => true,
): string[] {
  return Object.entries(state.reviews)
    .filter(([key]) => exists(key))
    .sort(([, a], [, b]) => a.box - b.box || b.lapses - a.lapses || a.due - b.due)
    .map(([key]) => key);
}

/** When the next card becomes due, if none is due now. */
export function nextDue(state: ProgressState, now: number, exists: (key: string) => boolean = () => true): number | null {
  const upcoming = Object.entries(state.reviews)
    .filter(([key, item]) => item.due > now && exists(key))
    .map(([, item]) => item.due);
  return upcoming.length > 0 ? Math.min(...upcoming) : null;
}

/**
 * Cards for progress saved before practice existed: every step answered
 * correctly (or with the answer open) gets one, as if it had just been met,
 * so an upgraded learner has something to practise straight away.
 */
export function seedReviews(lessons: ProgressState['lessons'], now: number): Record<string, ReviewCard> {
  const reviews: Record<string, ReviewCard> = {};
  for (const [lessonId, lesson] of Object.entries(lessons)) {
    for (const [stepId, step] of Object.entries(lesson.steps)) {
      if (!step.solved && !step.practiced && !step.revealed) continue;
      const box = step.revealed || !step.solved ? 0 : step.attempts <= 1 ? 2 : step.attempts === 2 ? 1 : 0;
      reviews[reviewKey(lessonId, stepId)] = card(box, now);
    }
  }
  return reviews;
}
