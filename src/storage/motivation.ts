import { MODULES, isLessonCompleted } from '../content/curriculum';
import { dayKey } from './model';
import type { DayActivity, ProgressState } from './types';

/* ------------------------------------------------------------------ *
 * Points, levels, the daily goal and the gentle streak.
 *
 * Everything here is *derived* from saved progress, never stored: it cannot
 * drift out of step with what the learner actually did, an import brings it
 * along for free, and a rule can be tuned later without a migration.
 * ------------------------------------------------------------------ */

export const XP = {
  /** A graded step solved without opening the answer. */
  solved: 10,
  /** A graded step finished with the answer open: still practice. */
  practised: 4,
  lesson: 25,
  module: 50,
  /** Each time a practice card was reviewed. */
  review: 3,
} as const;

export function xpFromState(state: ProgressState): number {
  let xp = 0;
  for (const lesson of Object.values(state.lessons)) {
    if (lesson.status === 'completed') xp += XP.lesson;
    for (const step of Object.values(lesson.steps)) {
      if (step.solved) xp += XP.solved;
      else if (step.practiced) xp += XP.practised;
    }
  }
  for (const module of MODULES) {
    if (module.lessonIds.length > 0 && module.lessonIds.every((id) => isLessonCompleted(id, state))) xp += XP.module;
  }
  for (const card of Object.values(state.reviews)) xp += card.reviews * XP.review;
  return xp;
}

/** XP needed to reach a level: 0, 50, 150, 300, 500, … (each step 50 more than the last). */
export function levelThreshold(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 25 * (n - 1) * n;
}

export interface LevelInfo {
  level: number;
  xp: number;
  /** XP where this level started, and where the next one starts. */
  floor: number;
  next: number;
  /** 0..1 of the way to the next level. */
  progress: number;
}

export function levelFor(xp: number): LevelInfo {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level += 1;
  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return { level, xp, floor, next, progress: (xp - floor) / (next - floor) };
}

/** Level names run out eventually; the last one then counts up ("… 2", "… 3"). */
export const LEVEL_TITLE_COUNT = 12;

/* ------------------------------ the day --------------------------- */

/** A day counts for the streak after a minute of learning or one answered step. */
export const ACTIVE_DAY_MS = 60 * 1000;
/** Time between two actions counts as learning up to this much. */
export const MAX_GAP_MS = 2 * 60 * 1000;

export function isActiveDay(day: DayActivity | undefined): boolean {
  return day !== undefined && (day.steps > 0 || day.ms >= ACTIVE_DAY_MS);
}

export interface GoalInfo {
  goalMinutes: number;
  minutesToday: number;
  /** 0..1, capped. */
  progress: number;
  met: boolean;
}

export function goalToday(state: ProgressState, now = Date.now()): GoalInfo {
  const goalMinutes = state.settings.dailyGoal;
  const ms = state.activity[dayKey(now)]?.ms ?? 0;
  const minutesToday = Math.floor(ms / 60_000);
  return {
    goalMinutes,
    minutesToday,
    progress: Math.min(1, ms / (goalMinutes * 60_000)),
    met: ms >= goalMinutes * 60_000,
  };
}

/** Days on which the learner reached their (current) daily goal. */
export function daysGoalMet(state: ProgressState): number {
  const goalMs = state.settings.dailyGoal * 60_000;
  return Object.values(state.activity).filter((day) => day.ms >= goalMs).length;
}

/* ----------------------------- the streak -------------------------- */

/** Rest days are earned one per week of learning, and at most this many are saved. */
export const MAX_REST_DAYS = 2;
export const REST_DAY_EVERY = 7;

export interface StreakInfo {
  /** Active days in the current run (rest days keep it alive but do not add to it). */
  current: number;
  best: number;
  /** Saved rest days, ready to cover a quiet day. */
  restDays: number;
  activeToday: boolean;
  /** Learned before, but the last run ended: time for a warm welcome, never a scolding. */
  returning: boolean;
}

function addDays(day: string, count: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d + count, 12));
}

/**
 * The gentle streak. Walks every day from the first one with activity to
 * yesterday: an active day extends the run (and every seventh earns a rest
 * day, up to two saved); a quiet day uses a saved rest day if there is one,
 * and only ends the run when there is none. Today never breaks anything: it
 * can only add to the run once something happens.
 */
export function streakInfo(activity: Record<string, DayActivity>, now = Date.now()): StreakInfo {
  const today = dayKey(now);
  const days = Object.keys(activity).filter((day) => isActiveDay(activity[day])).sort();
  const activeToday = isActiveDay(activity[today]);
  const first = days[0];
  if (!first) return { current: 0, best: 0, restDays: 1, activeToday: false, returning: false };

  let current = 0;
  let best = 0;
  // Everyone starts with one rest day in hand.
  let restDays = 1;
  for (let day = first; day < today; day = addDays(day, 1)) {
    if (isActiveDay(activity[day])) {
      current += 1;
      if (current % REST_DAY_EVERY === 0) restDays = Math.min(MAX_REST_DAYS, restDays + 1);
    } else if (restDays > 0) {
      restDays -= 1;
    } else {
      current = 0;
      restDays = 1;
    }
    best = Math.max(best, current);
  }
  if (activeToday) {
    current += 1;
    best = Math.max(best, current);
  }
  return { current, best, restDays, activeToday, returning: current === 0 && days.length > 0 };
}

/** Streak lengths worth a small celebration. */
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 60, 100, 200, 365];
