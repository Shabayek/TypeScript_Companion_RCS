/**
 * Translation kit: turns the English course into numbered text units for a
 * translator, and the translated units back into overlay files.
 *
 * A unit is one piece of prose. Fenced code blocks inside it are replaced by
 * tokens (⟦F1⟧, ⟦F2⟧…) so they are never retyped, and line breaks are written
 * as ⏎, so every unit fits on one line of the worklist. Identical texts in a
 * file share one unit.
 */
import type { Lesson, Loc, LocList, Step } from '../../src/content/schema';

export type Path = readonly (string | number)[];
export interface Unit {
  path: Path;
  text: string;
}

const MODES = ['base', 'story', 'explorer', 'pro'] as const;

function loc(path: Path, value: Loc | undefined, out: Unit[]): void {
  if (!value) return;
  for (const mode of MODES) {
    const text = value[mode];
    if (text !== undefined) out.push({ path: [...path, mode], text });
  }
}

function list(path: Path, value: LocList | undefined, out: Unit[]): void {
  if (!value) return;
  for (const mode of MODES) {
    value[mode]?.forEach((text, index) => out.push({ path: [...path, mode, index], text }));
  }
}

function step(path: Path, item: Step, out: Unit[]): void {
  loc([...path, 'prompt'], item.prompt, out);
  loc([...path, 'hint'], item.hint, out);
  loc([...path, 'strongHint'], item.strongHint, out);
  loc([...path, 'explain'], item.explain, out);
  switch (item.kind) {
    case 'read':
      loc([...path, 'body'], item.body, out);
      if (item.callout) {
        out.push({ path: [...path, 'callout', 'title'], text: item.callout.title });
        loc([...path, 'callout', 'body'], item.callout.body, out);
      }
      break;
    case 'compare':
      loc([...path, 'body'], item.body, out);
      for (const side of ['left', 'right'] as const) {
        out.push({ path: [...path, side, 'title'], text: item[side].title });
        loc([...path, side, 'caption'], item[side].caption, out);
      }
      break;
    case 'check':
      for (const choice of item.choices) {
        loc([...path, 'choices', choice.id, 'text'], choice.text, out);
        loc([...path, 'choices', choice.id, 'feedback'], choice.feedback, out);
      }
      break;
    case 'fix':
    case 'write':
      item.tests.forEach((test, index) => out.push({ path: [...path, 'testNames', index], text: test.name }));
      break;
    case 'types':
      item.typeTests.forEach((test, index) => out.push({ path: [...path, 'typeTestNames', index], text: test.name }));
      item.tests?.forEach((test, index) => out.push({ path: [...path, 'testNames', index], text: test.name }));
      break;
    case 'play':
      if (item.game.type === 'quiz') item.game.questions.forEach((question, index) => loc([...path, 'questions', index], question.question, out));
      break;
    case 'recap':
      list([...path, 'points'], item.points, out);
      break;
    default:
      break;
  }
  if (item.classic) step([...path, 'classic'], { ...item.classic, id: item.id } as Step, out);
}

/** Every prose unit of a module's lessons. */
export function lessonUnits(lessons: readonly Lesson[]): Unit[] {
  const out: Unit[] = [];
  for (const lesson of lessons) {
    list([lesson.id, 'objectives'], lesson.objectives, out);
    list([lesson.id, 'recap'], lesson.recap, out);
    for (const item of lesson.steps) step([lesson.id, 'steps', item.id], item, out);
  }
  return out;
}

const FENCE = /```[\s\S]*?```/g;

/** The worklist form of a text: fences as tokens, line breaks as ⏎. */
export function encode(text: string): { line: string; fences: string[] } {
  const fences: string[] = [];
  const line = text
    .replace(FENCE, (fence) => {
      fences.push(fence);
      return `⟦F${fences.length}⟧`;
    })
    .replace(/\n/g, '⏎');
  return { line, fences };
}

export function decode(line: string, fences: readonly string[]): string {
  return line.replace(/⏎/g, '\n').replace(/⟦F(\d+)⟧/g, (_, n: string) => fences[Number(n) - 1] ?? '');
}

/** Sets a value at a path inside a nested object, creating arrays for numeric keys. */
export function setPath(target: Record<string, unknown>, path: Path, value: unknown): void {
  let node: Record<string, unknown> | unknown[] = target;
  path.forEach((key, index) => {
    const last = index === path.length - 1;
    const container = node as Record<string | number, unknown>;
    if (last) {
      container[key] = value;
      return;
    }
    if (container[key] === undefined) container[key] = typeof path[index + 1] === 'number' ? [] : {};
    node = container[key] as Record<string, unknown>;
  });
}
