import { getLessonMeta } from '../../content/curriculum';
import { formatDate, intlLocale } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { loadLesson } from '../../content/loader';
import { isGradedKind, isGradedStep, type Lesson, type Step } from '../../content/schema';
import type { ProgressState } from '../../storage/types';
import { SESSION_SIZE, dueKeys, nextDue, splitReviewKey, weakestKeys } from '../../storage/review';

export interface ReviewItem {
  key: string;
  lesson: Lesson;
  step: Step;
}

/** Whether the course still has a graded step behind a card (from the catalog, no loading). */
export function isReviewable(key: string): boolean {
  const parts = splitReviewKey(key);
  if (!parts) return false;
  const step = getLessonMeta(parts.lessonId)?.steps.find((item) => item.id === parts.stepId);
  return step !== undefined && isGradedKind(step.kind);
}

/** The lesson and step behind a card, loading the lesson's content if needed. */
export async function loadReviewItem(key: string, language: string): Promise<ReviewItem | null> {
  const parts = splitReviewKey(key);
  if (!parts || !isReviewable(key)) return null;
  const lesson = await loadLesson(parts.lessonId, language);
  const step = lesson?.steps.find((item) => item.id === parts.stepId);
  if (!lesson || !step || !isGradedStep(step)) return null;
  return { key, lesson, step };
}

export interface PracticeSummary {
  /** Cards due now (graded steps that still exist). */
  due: number;
  /** All cards. */
  total: number;
  /** Cards in box 3 or higher: remembered several times in a row. */
  strong: number;
  /** When the next card is due, when none is due now. */
  nextDueAt: number | null;
}

export function practiceSummary(state: ProgressState, now = Date.now()): PracticeSummary {
  const keys = Object.keys(state.reviews).filter(isReviewable);
  return {
    due: dueKeys(state, now, isReviewable).length,
    total: keys.length,
    strong: keys.filter((key) => (state.reviews[key]?.box ?? 0) >= 3).length,
    nextDueAt: nextDue(state, now, isReviewable),
  };
}

/** The cards in a session: the due ones, or (on request) the weakest ones when none are due. */
export function sessionKeys(state: ProgressState, kind: 'due' | 'weakest', now = Date.now()): string[] {
  const keys = kind === 'due' ? dueKeys(state, now, isReviewable) : weakestKeys(state, isReviewable);
  return keys.slice(0, SESSION_SIZE);
}

/** A session, ready to show: loads the lessons its cards come from. */
export async function loadSession(
  state: ProgressState,
  kind: 'due' | 'weakest',
  language: string,
  now = Date.now(),
): Promise<ReviewItem[]> {
  const items = await Promise.all(sessionKeys(state, kind, now).map((key) => loadReviewItem(key, language)));
  return items.filter((item): item is ReviewItem => item !== null);
}

/** "later today", "tomorrow", "in 3 days", or a date, in the learner's language. */
export function whenDue(at: number, language: string, now = Date.now()): string {
  const day = (value: number) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };
  const days = Math.round((day(at) - day(now)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return t('review.laterToday');
  if (days < 7) return new Intl.RelativeTimeFormat(intlLocale(language), { numeric: 'auto' }).format(days, 'day');
  return formatDate(at, language, { month: 'long', day: 'numeric' });
}
