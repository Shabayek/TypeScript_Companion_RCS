import type { AgeMode, Experience } from '../content/schema';
import { DEFAULT_LANGUAGE } from '../i18n/languages';

/**
 * 3: adds `reviews` (spaced practice). Older progress gets cards seeded from
 * the steps it already answered.
 * 4: adds `activity` (learning time per day, for the daily goal and streak)
 * and `counters` (for explorer badges). Older progress starts both empty.
 */
export const SCHEMA_VERSION = 5;
export const STORAGE_KEY = 'ts-companion.state';
/** Code the learner typed in exercises and the Playground, by place. */
export const DRAFTS_KEY = 'ts-companion.drafts';
/** The progress an import replaced, kept for one-step undo. */
export const IMPORT_BACKUP_KEY = 'ts-companion.before-import';
export const APP_ID = 'typescript-companion';

export type TextSize = 1 | 2 | 3 | 4 | 5;

export interface Settings {
  mode: AgeMode;
  /** Language code from i18n/languages.ts. Changing it never touches progress. */
  language: string;
  textSize: TextSize;
  font: 'standard' | 'dyslexia';
  reduceMotion: 'auto' | 'on' | 'off';
  theme: 'auto' | 'light' | 'dark';
  readAloud: boolean;
  sound: boolean;
  mascot: boolean;
  /** Every lesson open, in any order. The suggested path stays visible. */
  unlockAll: boolean;
  /** No points, levels, streaks, celebrations or sounds: just the lessons. */
  quiet: boolean;
  /** Minutes of learning a day the learner aims for. */
  dailyGoal: DailyGoal;
  /**
   * Which JavaScript engine lessons are written for: detected (`auto`), or
   * chosen. Classic on a new phone shows what older phones show.
   */
  engine: EngineSetting;
}

export type EngineSetting = 'auto' | 'modern' | 'classic';

export const ENGINE_SETTINGS: readonly EngineSetting[] = ['auto', 'modern', 'classic'];

export type DailyGoal = 5 | 10 | 20;

export const DAILY_GOALS: readonly DailyGoal[] = [5, 10, 20];

/** One day of learning, keyed by local date (`YYYY-MM-DD`). */
export interface DayActivity {
  /** Engaged time, counted between actions and capped per gap (see motivation.ts). */
  ms: number;
  /** Steps answered or practised that day. */
  steps: number;
}

/** Things done outside lessons, for explorer badges. */
export type CounterId = 'playgroundRuns' | 'decoderLookups' | 'glossaryOpens' | 'practiceSessions';

export const COUNTER_IDS: readonly CounterId[] = ['playgroundRuns', 'decoderLookups', 'glossaryOpens', 'practiceSessions'];

export { EXPERIENCES, type Experience } from '../content/schema';

export interface Profile {
  name: string;
  onboarded: boolean;
  createdAt: number;
  /** Unknown for learners who onboarded before the question existed. */
  experience: Experience | null;
}

export interface StepProgress {
  /** Solved without revealing the answer. */
  solved: boolean;
  /** Practiced with the answer revealed. */
  practiced: boolean;
  attempts: number;
  revealed: boolean;
}

export interface LessonProgress {
  status: 'started' | 'completed';
  stepIndex: number;
  steps: Record<string, StepProgress>;
  timeMs: number;
  completedAt?: number;
}

/** One graded step in spaced practice. Keyed by `lessonId:stepId`. */
export interface ReviewCard {
  /** Leitner box, 0 (practise soon) to 5 (a month away). */
  box: number;
  /** When it is next due (milliseconds). */
  due: number;
  /** Times practised, and times the answer had to be opened. */
  reviews: number;
  lapses: number;
}

export interface ProgressState {
  schemaVersion: number;
  profile: Profile;
  settings: Settings;
  lessons: Record<string, LessonProgress>;
  badges: string[];
  lastLessonId: string | null;
  totalTimeMs: number;
  reviews: Record<string, ReviewCard>;
  activity: Record<string, DayActivity>;
  counters: Record<CounterId, number>;
  /**
   * The lessons this learner's course had when they last looked, so lessons
   * added later inside modules they already passed can be pointed out once.
   * `null` until the app first sees the course (a new learner).
   */
  seenLessons: string[] | null;
  /** Type Challenges arena, by puzzle id. */
  arena: Record<string, ArenaProgress>;
}

export interface ArenaProgress {
  solved: boolean;
  attempts: number;
  /** The solution was opened (a solve after that still counts). */
  revealed: boolean;
}

export interface ExportEnvelope {
  app: typeof APP_ID;
  schemaVersion: number;
  exportedAt: string;
  data: ProgressState;
}

/**
 * The only interface the rest of the app knows about. A Capacitor Preferences
 * adapter can be dropped in later without touching a single feature.
 */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  /**
   * Resolves once the value is stored durably. Rejects when durable storage
   * refused the write (quota, blocked); the value is still kept in memory for
   * the session, so the caller can warn instead of losing the session.
   */
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  /**
   * Optional: notify when *another* copy of the app (another tab) changed the
   * key. Adapters without cross-instance changes can leave it out.
   */
  subscribe?(key: string, onChange: (value: string | null) => void): () => void;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'explorer',
  language: DEFAULT_LANGUAGE,
  textSize: 3,
  font: 'standard',
  reduceMotion: 'auto',
  theme: 'auto',
  readAloud: false,
  sound: false,
  mascot: true,
  unlockAll: false,
  quiet: false,
  dailyGoal: 10,
  engine: 'auto',
};

export function emptyCounters(): Record<CounterId, number> {
  return { playgroundRuns: 0, decoderLookups: 0, glossaryOpens: 0, practiceSessions: 0 };
}

export function defaultState(now = Date.now()): ProgressState {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { name: '', onboarded: false, createdAt: now, experience: null },
    settings: { ...DEFAULT_SETTINGS },
    lessons: {},
    badges: [],
    lastLessonId: null,
    totalTimeMs: 0,
    reviews: {},
    activity: {},
    counters: emptyCounters(),
    seenLessons: null,
    arena: {},
  };
}

export function emptyStep(): StepProgress {
  return { solved: false, practiced: false, attempts: 0, revealed: false };
}

export function defaultLessonProgress(): LessonProgress {
  return { status: 'started', stepIndex: 0, steps: {}, timeMs: 0 };
}
