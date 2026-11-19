import type { AgeMode, FigureChoice, FigureId, Lesson, Loc, LocList } from './schema';

/**
 * Resolve a locale bundle for a reading mode, following the fallback chain.
 * Story falls back through Explorer to base; Pro prefers its own voice but will
 * borrow Explorer's before falling all the way back.
 */
export function loc(value: Loc, mode: AgeMode): string {
  if (mode === 'story') return value.story ?? value.explorer ?? value.base;
  if (mode === 'explorer') return value.explorer ?? value.base;
  return value.pro ?? value.base;
}

/** The diagram for this reading mode (see FigureChoice). */
export function figureFor(figure: FigureChoice, mode: AgeMode): FigureId {
  return typeof figure === 'string' ? figure : loc(figure, mode) as FigureId;
}

export function locList(value: LocList, mode: AgeMode): readonly string[] {
  if (mode === 'story') return value.story ?? value.explorer ?? value.base;
  if (mode === 'explorer') return value.explorer ?? value.base;
  return value.pro ?? value.base;
}

export function lessonTitle(lesson: Lesson, mode: AgeMode): string {
  return lesson.title[mode];
}

/**
 * Normalise program output for comparison: trim each line, drop blank lines at
 * the edges, and collapse runs of spaces. Keeps `predict` forgiving about
 * trailing whitespace without accepting a wrong answer.
 */
export function normaliseOutput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/[ \t]+/g, ' '))
    .join('\n')
    .trim();
}

/** Comparison used by `predict` and by the sandbox's expected-value checks. */
export function matchesOutput(actual: string, expected: string, alsoAccept: readonly string[] = []): boolean {
  const a = normaliseOutput(actual).toLowerCase();
  if (a === normaliseOutput(expected).toLowerCase()) return true;
  return alsoAccept.some((candidate) => normaliseOutput(candidate).toLowerCase() === a);
}

/**
 * Why a `predict` answer missed, when the miss has a common, explainable shape.
 * Only called after `matchesOutput` said no, so each case is a near miss:
 * - `quotes`: the answer wraps printed strings in quotes; console.log drops them.
 * - `line-breaks`: the right words, but split over lines differently.
 * - `order`: the right lines in a different order.
 * - `incomplete`: the first lines are right, but some are missing.
 * - `extra`: every expected line is there, plus more.
 */
export type PredictMiss = 'quotes' | 'line-breaks' | 'order' | 'incomplete' | 'extra';

export function predictMiss(actual: string, expected: string): PredictMiss | null {
  const lines = (value: string) =>
    normaliseOutput(value)
      .toLowerCase()
      .split('\n')
      .filter((line) => line !== '');
  const got = lines(actual);
  const want = lines(expected);
  if (got.length === 0) return null;
  const same = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((line, index) => line === b[index]);

  const unquote = (line: string) => line.replace(/^(["'`])(.*)\1$/, '$2');
  const unquoted = got.map(unquote);
  if (!same(unquoted, got) && same(unquoted, want)) return 'quotes';

  const words = (value: readonly string[]) => value.join(' ').split(' ').filter(Boolean);
  if (!same(got, want) && same(words(got), words(want))) return 'line-breaks';

  if (same([...got].sort(), [...want].sort())) return 'order';
  if (got.length < want.length && same(got, want.slice(0, got.length))) return 'incomplete';
  if (got.length > want.length && same(got.slice(0, want.length), want)) return 'extra';
  return null;
}

/** Stable 32-bit hash, used to shuffle `reorder` lines deterministically. */
export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 — small, deterministic PRNG so shuffles survive reloads. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle so that the result is never accidentally already correct, and is
 * stable for a given seed.
 */
export function shuffleLines(lines: readonly string[], seed: string): string[] {
  const random = seededRandom(hashString(seed) || 1);
  const copy = [...lines];
  const isSolved = (candidate: readonly string[]) =>
    candidate.every((line, index) => line === lines[index]);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const a = copy[i];
      const b = copy[j];
      if (a === undefined || b === undefined) continue;
      copy[i] = b;
      copy[j] = a;
    }
    if (!isSolved(copy)) break;
  }
  return copy;
}
