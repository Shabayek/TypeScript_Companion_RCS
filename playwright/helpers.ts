import type { Page } from '@playwright/test';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import type { CodeStep, Lesson } from '../src/content/schema';
import { STORAGE_KEY, defaultState, type LessonProgress, type ProgressState } from '../src/storage/types';

export function lesson(index: number): Lesson {
  const found = ALL_LESSONS[index];
  if (!found) throw new Error(`No lesson at index ${index}`);
  return found;
}

export const completed = (): LessonProgress => ({ status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 });
export const startedAt = (stepIndex: number): LessonProgress => ({
  status: 'started',
  stepIndex,
  steps: {},
  timeMs: 1,
});

/** An onboarded learner; every lesson before `upTo` (an index) is completed. */
export function learner(
  upTo = 0,
  edit: (state: ProgressState) => void = () => undefined,
): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  for (let i = 0; i < upTo; i += 1) state.lessons[lesson(i).id] = completed();
  edit(state);
  return state;
}

/**
 * Puts `state` in storage. Call before `start`.
 *
 * Written from a plain file on the app's origin, not from the app itself: an
 * app page open at that moment saves its own progress when it is left, which
 * overwrote the seeded state whenever it had a change still queued.
 */
export async function seed(page: Page, state: ProgressState): Promise<void> {
  await page.goto('/manifest.webmanifest');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(state)] as const);
}

/** Opens `hash` with a real app start (a hash change alone would not reload). */
export async function start(page: Page, hash: string): Promise<void> {
  await page.goto(`/${hash}`);
  await page.reload();
}

export async function stored(page: Page): Promise<ProgressState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), STORAGE_KEY);
}

/** Replaces everything in the code editor. */
export async function typeCode(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
}

/** The first lesson with a graded code step, its index, and the step's position. */
export function firstCodeStep(): { lessonIndex: number; stepIndex: number; step: CodeStep } {
  for (const [lessonIndex, item] of ALL_LESSONS.entries()) {
    const stepIndex = item.steps.findIndex((step) => step.kind === 'fix' || step.kind === 'write');
    const step = item.steps[stepIndex];
    if (step && (step.kind === 'fix' || step.kind === 'write')) return { lessonIndex, stepIndex, step };
  }
  throw new Error('No graded code step in the course');
}
