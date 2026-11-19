import { create } from 'zustand';
import { courseStats } from '../content/curriculum';
import { newlyEarned } from './badges';
import { STREAK_MILESTONES, goalToday, levelFor, streakInfo, xpFromState } from './motivation';
import {
  awardBadges,
  bumpCounter,
  recordActivity,
  completeLesson,
  decodeState,
  encodeState,
  markRevealed,
  migrate,
  readImport,
  recordAttempt,
  resetJourney,
  setStepIndex,
  toEnvelope,
} from './model';
import { createDebouncedSaver, createLocalAdapter } from './local';
import { recordReview, type ReviewOutcome } from './review';
import { onPageHidden } from '../platform/capabilities';
import { acknowledgeAllLessons, reconcileSeenLessons } from './newLessons';
import { msg, type Text } from '../i18n/text';
import {
  DRAFTS_KEY,
  IMPORT_BACKUP_KEY,
  STORAGE_KEY,
  defaultState,
  type CounterId,
  type ProgressState,
  type Settings,
} from './types';

/** Something worth a moment of celebration, shown once by the app shell. */
export type Celebration =
  | { kind: 'badge'; id: string }
  | { kind: 'level'; level: number }
  | { kind: 'goal'; minutes: number }
  | { kind: 'streak'; days: number };

/** What finishing a lesson earned, for its summary screen. */
export interface LessonFinish {
  badges: string[];
  /** What the summary celebrates (already filtered by Quiet mode). */
  celebrations: Celebration[];
}

/**
 * The celebrations between two states: new badges, a new level, today's goal
 * reached, a streak milestone. Quiet mode has none.
 */
export function celebrationsBetween(
  before: ProgressState,
  after: ProgressState,
  badges: readonly string[],
  now = Date.now(),
): Celebration[] {
  if (after.settings.quiet) return [];
  const events: Celebration[] = badges.map((id) => ({ kind: 'badge', id }));
  const levelBefore = levelFor(xpFromState(before)).level;
  const levelAfter = levelFor(xpFromState(after)).level;
  if (levelAfter > levelBefore) events.push({ kind: 'level', level: levelAfter });
  if (!goalToday(before, now).met && goalToday(after, now).met) {
    events.push({ kind: 'goal', minutes: after.settings.dailyGoal });
  }
  const streakBefore = streakInfo(before.activity, now).current;
  const streakAfter = streakInfo(after.activity, now).current;
  const milestone = STREAK_MILESTONES.find((days) => streakBefore < days && streakAfter >= days);
  if (milestone) events.push({ kind: 'streak', days: milestone });
  return events;
}

/**
 * How much of the time since the last action counts as learning: all of a
 * short gap, two minutes of a longer one (a long read), nothing after ten
 * (the learner was away).
 */
export function creditFor(gapMs: number): number {
  if (!Number.isFinite(gapMs) || gapMs <= 0) return 0;
  if (gapMs <= 2 * 60_000) return gapMs;
  if (gapMs <= 10 * 60_000) return 2 * 60_000;
  return 0;
}

const adapter = createLocalAdapter();
const save = createDebouncedSaver((value) => {
  adapter.set(STORAGE_KEY, value).then(
    () => {
      if (useJourney.getState().saveFailed) useJourney.setState({ saveFailed: false });
    },
    () => {
      // Durable storage refused the write (usually quota). The session keeps
      // its in-memory copy; Settings tells the learner instead of pretending.
      useJourney.setState({ saveFailed: true });
    },
  );
});

/** Drafts are saved separately from progress: they change on every keystroke. */
const saveDrafts = createDebouncedSaver((value) => {
  adapter.set(DRAFTS_KEY, value).catch(() => undefined);
}, 600);

/** Drafts longer than this are not kept (a pasted novel should not fill storage). */
const MAX_DRAFT_CHARS = 20_000;

function readDrafts(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const drafts: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key !== '__proto__' && typeof value === 'string' && value.length <= MAX_DRAFT_CHARS) drafts[key] = value;
    }
    return drafts;
  } catch {
    return {};
  }
}

/** The in-flight hydration, so concurrent calls (StrictMode) share one read. */
let hydrating: Promise<void> | null = null;

/** What a progress file (or this device) holds, for the import preview. */
export interface ProgressSummary {
  name: string;
  lessonsCompleted: number;
  badges: number;
  stepsSolved: number;
  /** When the most recent lesson was finished (milliseconds), if ever. */
  lastFinishedAt: number | null;
}

export function summarize(state: ProgressState): ProgressSummary {
  const stats = courseStats(state);
  const finished = Object.values(state.lessons)
    .map((lesson) => lesson.completedAt)
    .filter((at): at is number => typeof at === 'number');
  return {
    name: state.profile.name,
    lessonsCompleted: stats.completed,
    badges: state.badges.length,
    stepsSolved: stats.solved,
    lastFinishedAt: finished.length > 0 ? Math.max(...finished) : null,
  };
}

export type ImportPreview =
  | {
      ok: true;
      incoming: ProgressSummary;
      current: ProgressSummary;
      exportedAt: number | null;
      /** Set when importing would replace more, or newer, progress. */
      warning: Text | null;
    }
  | { ok: false; message: Text };

const NOT_JSON = msg('data.notJson');
const NO_PROGRESS = msg('data.noProgress');

export interface JourneyStore {
  state: ProgressState;
  /** False until the saved state has been read. Nothing is written before that. */
  hydrated: boolean;
  /** True when the last write to durable storage failed. */
  saveFailed: boolean;
  /** The progress the last import replaced, as saved text; null when there is none. */
  importBackup: string | null;
  /**
   * Code the learner typed, by place (`lessonId:stepId`, `playground:sample`).
   * Leaving a step, or reloading, used to throw it away.
   */
  drafts: Record<string, string>;
  /** When the current lesson was opened, for honest time tracking. */
  openedAt: number | null;
  /** The learner's last action, for counting engaged time per day. */
  lastActiveAt: number | null;
  /** Waiting to be shown, oldest first. */
  celebrations: Celebration[];

  hydrate: () => Promise<void>;
  recordResult: (lessonId: string, stepId: string, correct: boolean, revealed: boolean) => void;
  reveal: (lessonId: string, stepId: string) => void;
  /** A practice card was answered (see review.ts). */
  practised: (key: string, outcome: ReviewOutcome) => void;
  goToStep: (lessonId: string, index: number) => void;
  finishLesson: (lessonId: string) => LessonFinish;
  /** Something done outside lessons (Playground, decoder, glossary, practice). */
  count: (id: CounterId) => void;
  /** The shell showed the oldest celebration. */
  dismissCelebration: () => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setProfile: (patch: Partial<ProgressState['profile']>) => void;
  reset: () => void;
  /** The learner has seen the note about lessons added behind them. */
  acknowledgeNewLessons: () => void;
  /** A Type Challenges arena attempt. */
  recordArena: (puzzleId: string, result: { correct: boolean; revealed: boolean }) => void;
  /** Reads a progress file without changing anything, for the confirmation step. */
  previewImport: (json: string) => ImportPreview;
  /** Replaces progress with the file's, keeping the current progress for undo. */
  replaceState: (json: string) => { ok: boolean; message: Text };
  /** Puts back the progress the last import replaced. */
  undoImport: () => { ok: boolean; message: Text };
  /** Keeps the learner's code for a place; `null` forgets it (back to the starter). */
  setDraft: (key: string, code: string | null) => void;
  exportJson: () => string;
}

/**
 * Queue a write of `state`. `urgent` writes immediately instead of waiting for
 * the debounce window: used for moments a learner would be upset to lose
 * (finishing a lesson, onboarding, import, reset).
 *
 * Writes before hydration are dropped on purpose. Anything computed at that
 * point is derived from the empty default state, and saving it would overwrite
 * the learner's real progress — which is exactly what used to happen when the
 * app was reloaded on a lesson page.
 */
function persist(state: ProgressState, urgent = false): void {
  if (!useJourney.getState().hydrated) return;
  save(encodeState(state));
  if (urgent) save.flush();
}

/** Engaged time since the learner's last action (see `creditFor`), and now is the last action. */
function activeCredit(now: number): number {
  const last = useJourney.getState().lastActiveAt;
  useJourney.setState({ lastActiveAt: now });
  return last === null ? 0 : creditFor(now - last);
}

/**
 * Every progress change goes through here: award any badge the new state has
 * earned, queue what is worth celebrating, save.
 */
function commit(
  before: ProgressState,
  after: ProgressState,
  { now, urgent = false, announce = true }: { now: number; urgent?: boolean; announce?: boolean },
): { badges: string[]; celebrations: Celebration[] } {
  const badges = newlyEarned(after, now);
  const next = awardBadges(after, badges);
  const celebrations = celebrationsBetween(before, next, badges, now);
  useJourney.setState((store) => ({
    state: next,
    celebrations: announce ? [...store.celebrations, ...celebrations] : store.celebrations,
  }));
  persist(next, urgent);
  return { badges, celebrations };
}

export const useJourney = create<JourneyStore>((set, get) => ({
  state: defaultState(),
  hydrated: false,
  saveFailed: false,
  importBackup: null,
  drafts: {},
  openedAt: null,
  lastActiveAt: null,
  celebrations: [],

  hydrate() {
    if (get().hydrated) return Promise.resolve();
    if (!hydrating) {
      hydrating = (async () => {
        try {
          const raw = await adapter.get(STORAGE_KEY);
          const backup = await adapter.get(IMPORT_BACKUP_KEY);
          const drafts = readDrafts(await adapter.get(DRAFTS_KEY));
          // Anything queued so far was derived from the default state.
          save.cancel();
          saveDrafts.cancel();
          const decoded = decodeState(raw);
          const state = reconcileSeenLessons(decoded);
          set({ state, hydrated: true, importBackup: backup, drafts });
          if (state !== decoded && raw !== null) persist(state);
        } finally {
          hydrating = null;
        }
      })();
    }
    return hydrating;
  },

  recordResult(lessonId, stepId, correct, revealed) {
    const current = get().state;
    const now = Date.now();
    const next = recordAttempt(current, lessonId, stepId, { correct, revealed }, now);
    commit(current, recordActivity(next, now, activeCredit(now), true), { now });
  },

  reveal(lessonId, stepId) {
    const current = get().state;
    const next = markRevealed(current, lessonId, stepId);
    set({ state: next });
    persist(next);
  },

  practised(key, outcome) {
    const current = get().state;
    const now = Date.now();
    const next = recordReview(current, key, outcome, now);
    commit(current, recordActivity(next, now, activeCredit(now), true), { now });
  },

  goToStep(lessonId, index) {
    const current = get().state;
    const now = Date.now();
    const alreadyOpen = get().openedAt !== null && current.lastLessonId === lessonId;
    const next = recordActivity(setStepIndex(current, lessonId, index), now, activeCredit(now));
    set({ openedAt: alreadyOpen ? get().openedAt : now });
    commit(current, next, { now });
  },

  finishLesson(lessonId) {
    const current = get().state;
    const now = Date.now();
    const openedAt = get().openedAt ?? now;
    const spent = Math.min(now - openedAt, 45 * 60 * 1000);
    const next = recordActivity(completeLesson(current, lessonId, spent, []), now, activeCredit(now));
    set({ openedAt: now });
    // The lesson's own summary screen celebrates these, so the shell does not.
    const { badges, celebrations } = commit(current, next, { now, urgent: true, announce: false });
    return { badges, celebrations };
  },

  count(id) {
    const current = get().state;
    commit(current, bumpCounter(current, id), { now: Date.now() });
  },

  dismissCelebration() {
    set({ celebrations: get().celebrations.slice(1) });
  },

  patchSettings(patch) {
    const current = get().state;
    const next = { ...current, settings: { ...current.settings, ...patch } };
    // Quiet mode also clears anything still waiting to be celebrated.
    set(next.settings.quiet ? { state: next, celebrations: [] } : { state: next });
    persist(next);
  },

  setProfile(patch) {
    const current = get().state;
    const next = { ...current, profile: { ...current.profile, ...patch } };
    set({ state: next });
    persist(next, true);
  },

  reset() {
    const current = get().state;
    const next = resetJourney(current);
    set({ state: next, drafts: {} });
    persist(next, true);
    saveDrafts('{}');
    saveDrafts.flush();
  },

  setDraft(key, code) {
    const drafts = { ...get().drafts };
    if (code === null || code.length > MAX_DRAFT_CHARS) delete drafts[key];
    else drafts[key] = code;
    set({ drafts });
    if (get().hydrated) saveDrafts(JSON.stringify(drafts));
  },

  previewImport(json) {
    let file;
    try {
      file = readImport(json);
    } catch {
      return { ok: false, message: NOT_JSON };
    }
    if (Object.keys(file.state.lessons).length === 0 && !file.state.profile.onboarded) {
      return { ok: false, message: NO_PROGRESS };
    }
    const incoming = summarize(file.state);
    const current = summarize(get().state);
    let warning: Text | null = null;
    if (incoming.lessonsCompleted < current.lessonsCompleted) {
      warning = msg('data.lessProgress', { count: incoming.lessonsCompleted, current: current.lessonsCompleted });
    } else if (
      incoming.lessonsCompleted === current.lessonsCompleted &&
      current.lastFinishedAt !== null &&
      (incoming.lastFinishedAt ?? 0) < current.lastFinishedAt
    ) {
      warning = msg('data.older');
    }
    return { ok: true, incoming, current, exportedAt: file.exportedAt, warning };
  },

  acknowledgeNewLessons() {
    const next = acknowledgeAllLessons(get().state);
    set({ state: next });
    persist(next);
  },

  recordArena(puzzleId, result) {
    const current = get().state;
    const now = Date.now();
    const before = current.arena[puzzleId] ?? { solved: false, attempts: 0, revealed: false };
    const next: ProgressState = {
      ...current,
      arena: {
        ...current.arena,
        [puzzleId]: {
          solved: before.solved || (result.correct && !result.revealed),
          attempts: before.attempts + (result.revealed ? 0 : 1),
          revealed: before.revealed || result.revealed,
        },
      },
    };
    commit(current, recordActivity(next, now, activeCredit(now), !result.revealed), { now });
  },

  replaceState(json) {
    let parsed: ProgressState;
    try {
      parsed = readImport(json).state;
    } catch {
      return { ok: false, message: NOT_JSON };
    }
    if (Object.keys(parsed.lessons).length === 0 && !parsed.profile.onboarded) {
      return { ok: false, message: NO_PROGRESS };
    }
    // Keep what is being replaced, so a mistaken import can be undone (even
    // after a reload). An import used to overwrite everything immediately.
    const backup = encodeState(get().state);
    adapter.set(IMPORT_BACKUP_KEY, backup).catch(() => undefined);
    const reconciled = reconcileSeenLessons(parsed);
    set({ state: reconciled, importBackup: backup });
    persist(reconciled, true);
    return { ok: true, message: msg('data.restoredShort') };
  },

  undoImport() {
    const backup = get().importBackup;
    if (backup === null) return { ok: false, message: msg('data.nothingToUndo') };
    const restored = decodeState(backup);
    set({ state: restored, importBackup: null });
    persist(restored, true);
    adapter.remove(IMPORT_BACKUP_KEY).catch(() => undefined);
    return { ok: true, message: msg('data.undone') };
  },

  exportJson() {
    return JSON.stringify(toEnvelope(get().state), null, 2);
  },
}));

/**
 * Keeps storage and the running app in step for as long as the app is open:
 *
 * - Saves immediately when the page is hidden or closed. The debounce window
 *   used to lose the last changes when a phone app was swiped away.
 * - Adopts progress saved by another tab instead of overwriting it later.
 *   That tab's write is newer than anything still queued here, so the queued
 *   write is dropped.
 *
 * Returns a cleanup function. Called once by the app shell.
 */
export function startPersistence(): () => void {
  const stopHidden = onPageHidden(() => {
    save.flush();
    saveDrafts.flush();
  });
  const stopSync =
    adapter.subscribe?.(STORAGE_KEY, (raw) => {
      if (raw === null || !useJourney.getState().hydrated) return;
      save.cancel();
      useJourney.setState({ state: decodeState(raw) });
    }) ?? (() => undefined);

  return () => {
    stopHidden();
    stopSync();
  };
}

/* Selectors ------------------------------------------------------- */

/** First lesson that isn't finished, in course order. */
/** Kept here for existing imports; the rule lives with the curriculum. */
export { nextUpLessonId } from '../content/curriculum';

/** Test-only escape hatch: rebuild the store from a given state. */
export function __setStateForTests(state: ProgressState): void {
  save.cancel();
  saveDrafts.cancel();
  hydrating = null;
  useJourney.setState({
    state: migrate(state),
    hydrated: true,
    saveFailed: false,
    importBackup: null,
    drafts: {},
    celebrations: [],
    lastActiveAt: null,
  });
}
