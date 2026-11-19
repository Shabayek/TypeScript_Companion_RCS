import { AGE_MODES, type AgeMode } from '../content/schema';
import {
  APP_ID,
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
  defaultLessonProgress,
  defaultState,
  emptyStep,
  type ExportEnvelope,
  type LessonProgress,
  type ProgressState,
  type Settings,
  type StepProgress,
  type ReviewCard,
  type TextSize,
  EXPERIENCES,
  type Experience,
  COUNTER_IDS,
  DAILY_GOALS,
  ENGINE_SETTINGS,
  type EngineSetting,
  emptyCounters,
  type CounterId,
  type DailyGoal,
  type DayActivity,
  type ArenaProgress,
} from './types';
import { LEGACY_LESSON_IDS } from './legacy';
import { isSupportedLanguage } from '../i18n/languages';
import { TOP_BOX, reviewKey, scheduleFromLesson, seedReviews, splitReviewKey } from './review';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asAgeMode(value: unknown, fallback: AgeMode): AgeMode {
  return AGE_MODES.includes(value as AgeMode) ? (value as AgeMode) : fallback;
}

/**
 * Keys that must never be copied from untrusted JSON into a plain object:
 * assigning `__proto__` replaces the object's prototype instead of adding an
 * entry, which made every lesson look "completed" after a crafted import.
 */
const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isSafeKey(key: string): boolean {
  return key.length > 0 && !RESERVED_KEYS.has(key);
}

/**
 * A whole, finite, non-negative number. JSON can carry `1e400` (Infinity),
 * fractions, and negatives; a step index of 1.5 used to render an empty lesson.
 */
function asCount(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function asTimestamp(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function asTextSize(value: unknown): TextSize {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 3;
  const clamped = Math.min(5, Math.max(1, n));
  return clamped as TextSize;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Coerce anything found on disk (or pasted into the import box) into a valid
 * state object. Unknown keys are dropped, missing keys are defaulted, and the
 * version is always the current one.
 */
export function migrate(raw: unknown): ProgressState {
  const base = defaultState();
  if (!isRecord(raw)) return base;

  const profileRaw = isRecord(raw.profile) ? raw.profile : {};
  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};

  const settings: Settings = {
    mode: asAgeMode(settingsRaw.mode, DEFAULT_SETTINGS.mode),
    // A language this version does not know (say, from a newer app's export)
    // falls back to the default instead of showing untranslated keys.
    language: isSupportedLanguage(settingsRaw.language) ? settingsRaw.language : DEFAULT_SETTINGS.language,
    textSize: asTextSize(settingsRaw.textSize),
    font: settingsRaw.font === 'dyslexia' ? 'dyslexia' : 'standard',
    reduceMotion:
      settingsRaw.reduceMotion === 'on' || settingsRaw.reduceMotion === 'off'
        ? settingsRaw.reduceMotion
        : 'auto',
    theme:
      settingsRaw.theme === 'light' || settingsRaw.theme === 'dark' ? settingsRaw.theme : 'auto',
    readAloud: asBoolean(settingsRaw.readAloud, DEFAULT_SETTINGS.readAloud),
    sound: asBoolean(settingsRaw.sound, DEFAULT_SETTINGS.sound),
    mascot: asBoolean(settingsRaw.mascot, DEFAULT_SETTINGS.mascot),
    unlockAll: asBoolean(settingsRaw.unlockAll, DEFAULT_SETTINGS.unlockAll),
    quiet: asBoolean(settingsRaw.quiet, DEFAULT_SETTINGS.quiet),
    dailyGoal: DAILY_GOALS.includes(settingsRaw.dailyGoal as DailyGoal)
      ? (settingsRaw.dailyGoal as DailyGoal)
      : DEFAULT_SETTINGS.dailyGoal,
    engine: ENGINE_SETTINGS.includes(settingsRaw.engine as EngineSetting)
      ? (settingsRaw.engine as EngineSetting)
      : DEFAULT_SETTINGS.engine,
  };

  const lessons: Record<string, LessonProgress> = {};
  if (isRecord(raw.lessons)) {
    for (const [lessonId, value] of Object.entries(raw.lessons)) {
      if (!isSafeKey(lessonId) || !isRecord(value)) continue;
      const steps: Record<string, StepProgress> = {};
      if (isRecord(value.steps)) {
        for (const [stepId, step] of Object.entries(value.steps)) {
          if (!isSafeKey(stepId) || !isRecord(step)) continue;
          steps[stepId] = {
            solved: asBoolean(step.solved, false),
            practiced: asBoolean(step.practiced, false),
            attempts: asCount(step.attempts),
            revealed: asBoolean(step.revealed, false),
          };
        }
      }
      const completedAt = asTimestamp(value.completedAt);
      lessons[lessonId] = {
        status: value.status === 'completed' ? 'completed' : 'started',
        stepIndex: asCount(value.stepIndex),
        steps,
        timeMs: asCount(value.timeMs),
        ...(completedAt !== undefined ? { completedAt } : {}),
      };
    }
  }

  // Practice cards. Progress from before practice existed has no `reviews`
  // key at all: seed cards from what it already answered.
  const reviews: Record<string, ReviewCard> = {};
  if (isRecord(raw.reviews)) {
    for (const [key, value] of Object.entries(raw.reviews)) {
      const parts = splitReviewKey(key);
      if (!parts || !isSafeKey(parts.lessonId) || !isSafeKey(parts.stepId) || !isRecord(value)) continue;
      const due = asTimestamp(value.due);
      if (due === undefined) continue;
      reviews[key] = {
        box: Math.min(TOP_BOX, asCount(value.box)),
        due,
        reviews: asCount(value.reviews),
        lapses: asCount(value.lapses),
      };
    }
  } else {
    Object.assign(reviews, seedReviews(lessons, Date.now()));
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: asString(profileRaw.name).slice(0, 40),
      onboarded: asBoolean(profileRaw.onboarded, false),
      createdAt: asTimestamp(profileRaw.createdAt) ?? base.profile.createdAt,
      experience: EXPERIENCES.includes(profileRaw.experience as Experience)
        ? (profileRaw.experience as Experience)
        : null,
    },
    settings,
    lessons,
    badges: Array.isArray(raw.badges)
      ? [...new Set(raw.badges.filter((b): b is string => typeof b === 'string'))]
      : [],
    lastLessonId: typeof raw.lastLessonId === 'string' ? raw.lastLessonId : null,
    totalTimeMs: asCount(raw.totalTimeMs),
    reviews,
    activity: readActivity(raw.activity),
    counters: readCounters(raw.counters),
    seenLessons: readSeenLessons(raw, lessons),
    arena: readArena(raw.arena),
  };
}

/**
 * Which lessons the learner's course had. Saved since version 5; progress
 * from before that was made with the original 32 lessons.
 */
function readSeenLessons(raw: Record<string, unknown>, lessons: Record<string, LessonProgress>): string[] | null {
  if (Array.isArray(raw.seenLessons)) {
    return [...new Set(raw.seenLessons.filter((id): id is string => typeof id === 'string' && isSafeKey(id)))];
  }
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  return version < 5 && Object.keys(lessons).length > 0 ? [...LEGACY_LESSON_IDS] : null;
}

function readArena(raw: unknown): Record<string, ArenaProgress> {
  const arena: Record<string, ArenaProgress> = {};
  if (!isRecord(raw)) return arena;
  for (const [id, value] of Object.entries(raw)) {
    if (!isSafeKey(id) || !isRecord(value)) continue;
    arena[id] = {
      solved: asBoolean(value.solved, false),
      attempts: asCount(value.attempts),
      revealed: asBoolean(value.revealed, false),
    };
  }
  return arena;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
/** Days of activity kept: enough for a year of streak history and a bit more. */
export const ACTIVITY_DAYS_KEPT = 400;
/** No day can hold more than a day. */
const DAY_MS = 24 * 60 * 60 * 1000;

function readActivity(raw: unknown): Record<string, DayActivity> {
  const activity: Record<string, DayActivity> = {};
  if (!isRecord(raw)) return activity;
  for (const [day, value] of Object.entries(raw)) {
    if (!DAY_KEY.test(day) || !isRecord(value)) continue;
    activity[day] = { ms: Math.min(DAY_MS, asCount(value.ms)), steps: asCount(value.steps) };
  }
  return pruneActivity(activity);
}

function readCounters(raw: unknown): Record<CounterId, number> {
  const counters = emptyCounters();
  if (!isRecord(raw)) return counters;
  for (const id of COUNTER_IDS) counters[id] = asCount(raw[id]);
  return counters;
}

/** Keeps the most recent days only, so the saved file stays small. */
export function pruneActivity(activity: Record<string, DayActivity>): Record<string, DayActivity> {
  const days = Object.keys(activity).sort();
  if (days.length <= ACTIVITY_DAYS_KEPT) return activity;
  const kept: Record<string, DayActivity> = {};
  for (const day of days.slice(-ACTIVITY_DAYS_KEPT)) kept[day] = activity[day] as DayActivity;
  return kept;
}

/** The local calendar day of a moment, as `YYYY-MM-DD`. */
export function dayKey(at: number | Date): string {
  const date = new Date(at);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Adds learning time (and, for an answered step, a step) to the day `now`
 * falls on.
 */
export function recordActivity(
  state: ProgressState,
  now: number,
  creditMs: number,
  answeredStep = false,
): ProgressState {
  const day = dayKey(now);
  const today = state.activity[day] ?? { ms: 0, steps: 0 };
  const ms = Math.min(DAY_MS, today.ms + Math.max(0, Math.round(creditMs)));
  const steps = today.steps + (answeredStep ? 1 : 0);
  if (ms === today.ms && steps === today.steps && state.activity[day]) return state;
  return { ...state, activity: pruneActivity({ ...state.activity, [day]: { ms, steps } }) };
}

export function bumpCounter(state: ProgressState, id: CounterId): ProgressState {
  return { ...state, counters: { ...state.counters, [id]: (state.counters[id] ?? 0) + 1 } };
}

/** Adds badges to what the learner has; never removes one. */
export function awardBadges(state: ProgressState, badges: readonly string[]): ProgressState {
  const missing = badges.filter((badge) => !state.badges.includes(badge));
  return missing.length === 0 ? state : { ...state, badges: [...state.badges, ...missing] };
}

export function encodeState(state: ProgressState): string {
  return JSON.stringify(state);
}

export function decodeState(raw: string | null): ProgressState {
  if (!raw) return defaultState();
  try {
    return migrate(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function toEnvelope(state: ProgressState, now = new Date()): ExportEnvelope {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: state,
  };
}

export interface ImportedFile {
  state: ProgressState;
  /** When the file was exported, if it says (milliseconds). */
  exportedAt: number | null;
}

/** Reads an export envelope, or a bare state object. Throws on invalid JSON. */
export function readImport(raw: string): ImportedFile {
  const parsed: unknown = JSON.parse(raw);
  if (isRecord(parsed) && isRecord(parsed.data)) {
    const at = typeof parsed.exportedAt === 'string' ? Date.parse(parsed.exportedAt) : Number.NaN;
    return { state: migrate(parsed.data), exportedAt: Number.isFinite(at) ? at : null };
  }
  return { state: migrate(parsed), exportedAt: null };
}

export function fromEnvelope(raw: string): ProgressState {
  return readImport(raw).state;
}

/* ------------------------------------------------------------------ *
 * Pure progress transitions. Kept out of the store so they are easy to
 * test and impossible to get subtly different between callers.
 * ------------------------------------------------------------------ */

function lessonOf(state: ProgressState, lessonId: string): LessonProgress {
  return state.lessons[lessonId] ?? defaultLessonProgress();
}

export function recordAttempt(
  state: ProgressState,
  lessonId: string,
  stepId: string,
  result: { correct: boolean; revealed: boolean },
  now = Date.now(),
): ProgressState {
  const lesson = lessonOf(state, lessonId);
  const previous = lesson.steps[stepId] ?? emptyStep();
  const solved = result.correct && !result.revealed;
  const practiced = result.correct && result.revealed;
  const attempts = previous.attempts + 1;
  // Graded steps become practice cards (see review.ts).
  const scheduled = scheduleFromLesson(state, reviewKey(lessonId, stepId), { ...result, attempts }, now);

  return {
    ...scheduled,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...lesson,
        status: lesson.status === 'completed' ? 'completed' : 'started',
        steps: {
          ...lesson.steps,
          [stepId]: {
            solved: previous.solved || solved,
            practiced: previous.practiced || practiced,
            attempts,
            revealed: previous.revealed || result.revealed,
          },
        },
      },
    },
  };
}

export function markRevealed(
  state: ProgressState,
  lessonId: string,
  stepId: string,
): ProgressState {
  const lesson = lessonOf(state, lessonId);
  const previous = lesson.steps[stepId] ?? emptyStep();
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...lesson,
        steps: { ...lesson.steps, [stepId]: { ...previous, revealed: true } },
      },
    },
  };
}

export function setStepIndex(
  state: ProgressState,
  lessonId: string,
  stepIndex: number,
): ProgressState {
  const lesson = lessonOf(state, lessonId);
  return {
    ...state,
    lastLessonId: lessonId,
    lessons: {
      ...state.lessons,
      [lessonId]: { ...lesson, stepIndex: asCount(stepIndex) },
    },
  };
}

/**
 * Where to resume a lesson: the saved step for an unfinished lesson, otherwise
 * the start. Always a valid index — stored data can come from an old version
 * or an imported file, and an out-of-range index used to render nothing.
 */
export function resumeIndex(
  progress: { status: string; stepIndex: number } | undefined,
  stepCount: number,
): number {
  if (!progress || progress.status === 'completed' || stepCount <= 0) return 0;
  const saved = Number.isFinite(progress.stepIndex) ? Math.floor(progress.stepIndex) : 0;
  return Math.min(Math.max(0, saved), stepCount - 1);
}

export function completeLesson(
  state: ProgressState,
  lessonId: string,
  spentMs: number,
  badges: readonly string[],
): ProgressState {
  const lesson = lessonOf(state, lessonId);
  const nextBadges = new Set(state.badges);
  for (const badge of badges) nextBadges.add(badge);

  return {
    ...state,
    lastLessonId: lessonId,
    totalTimeMs: state.totalTimeMs + Math.max(0, spentMs),
    badges: [...nextBadges],
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...lesson,
        status: 'completed',
        stepIndex: 0,
        timeMs: lesson.timeMs + Math.max(0, spentMs),
        completedAt: Date.now(),
      },
    },
  };
}

export function resetJourney(state: ProgressState): ProgressState {
  return {
    ...defaultState(state.profile.createdAt),
    profile: { ...state.profile, onboarded: true },
    settings: state.settings,
  };
}
