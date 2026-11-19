import type { Loc, LocList } from './schema';

/**
 * Authoring helpers. `L` and `LL` take (base, story?, pro?) so a lesson can be
 * written in one voice first and enriched later without touching its shape.
 */
export function L(base: string, story?: string, pro?: string): Loc {
  const value: Loc = { base };
  if (story !== undefined) value.story = story;
  if (pro !== undefined) value.pro = pro;
  return value;
}

export function LL(
  base: readonly string[],
  story?: readonly string[],
  pro?: readonly string[],
): LocList {
  const value: LocList = { base };
  if (story !== undefined) value.story = story;
  if (pro !== undefined) value.pro = pro;
  return value;
}

/** Join paragraphs with a blank line, which is how Markdown separates them. */
export const md = (...paragraphs: string[]): string => paragraphs.join('\n\n');

export const bullets = (...items: string[]): string => items.map((item) => `- ${item}`).join('\n');

/**
 * Join code lines. Using this instead of template literals keeps code samples
 * free of escaped backticks, so lessons containing `${...}` stay readable.
 */
export const c = (...lines: string[]): string => lines.join('\n');
