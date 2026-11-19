import type { CodeStep, Lesson, MazeMove, PetAction, PlayGame, PlayStep, TodoAction } from './schema';

/** What a game hands its driver (see PlayGame). */
export type PlayInput =
  | { answers: readonly boolean[] }
  | { budget: number; expenses: readonly { label: string; amount: number }[] }
  | { spins: readonly number[] }
  | { level: number; maze: readonly string[]; moves: readonly MazeMove[] }
  | { name: string; actions: readonly PetAction[] }
  | { actions: readonly TodoAction[] }
  | { moves: readonly string[]; seed: number }
  | { commands: readonly string[] };

/** A typical input, for content validation and tests. */
export function sampleInput(game: PlayGame): PlayInput {
  switch (game.type) {
    case 'quiz':
      return { answers: game.questions.map((_, index) => index % 2 === 0) };
    case 'budget':
      return { budget: game.budget, expenses: game.suggestions.slice(0, 2) };
    case 'spinner':
      return { spins: game.wheels.map((_, index) => 7 + index * 5) };
    case 'maze':
      return { level: 1, maze: game.levels[0] ?? [], moves: ['right', 'right', 'down', 'left', 'up'] };
    case 'pet':
      return { name: game.name, actions: ['wait', 'feed', 'play', 'rest', 'wait'] };
    case 'todo':
      return {
        actions: [
          { type: 'add', text: game.suggestions[0] ?? 'Water the plants' },
          { type: 'add', text: game.suggestions[1] ?? 'Read a chapter' },
          { type: 'toggle', id: 1 },
          { type: 'add', text: game.suggestions[2] ?? 'Call Grandma' },
          { type: 'remove', id: 3 },
          { type: 'clearDone' },
        ],
      };
    case 'battle':
      return { moves: [game.moves[0] ?? 'fire', game.moves[1] ?? 'water', game.moves[2] ?? 'leaf'], seed: 7 };
    case 'adventure':
      return { commands: [...game.suggestions.slice(0, 4), 'dance'] };
  }
}

/** The steps a game runs, in program order; unknown or non-code ids are dropped. */
export function usedSteps(lesson: Lesson, step: PlayStep): CodeStep[] {
  return step.uses
    .map((id) => lesson.steps.find((item) => item.id === id))
    .filter((item): item is CodeStep => item?.kind === 'write' || item?.kind === 'fix');
}

/** The whole program: the pieces of code, the input, then the driver. */
export function playProgram(sources: readonly string[], input: PlayInput, driver: string): string {
  return [...sources.map((source) => source.trim()), `const input = ${JSON.stringify(input)};`, driver.trim()].join('\n\n');
}

/** A line of game output: data for the screen (`@tag payload`), or text to show. */
export type ScreenLine = { kind: 'data'; tag: string; payload: string } | { kind: 'text'; text: string };

export function screenLines(lines: readonly string[]): ScreenLine[] {
  return lines.map((line) => {
    const match = /^@([a-z]+) (.*)$/.exec(line);
    return match ? { kind: 'data', tag: match[1] ?? '', payload: match[2] ?? '' } : { kind: 'text', text: line };
  });
}

/** The payloads of one tag, in order. */
export function dataLines(lines: readonly string[], tag: string): string[] {
  return screenLines(lines).flatMap((line) => (line.kind === 'data' && line.tag === tag ? [line.payload] : []));
}

/** Output lines meant to be read (everything but `@tag` data). */
export function textLines(lines: readonly string[]): string[] {
  return screenLines(lines).flatMap((line) => (line.kind === 'text' ? [line.text] : []));
}

/** Parses JSON data from the learner's program, or null when it is not valid. */
export function parseData<T>(payload: string | undefined): T | null {
  if (payload === undefined) return null;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

/** The tag each game's screen needs its driver to print (validated at build time). */
export const GAME_DATA_TAG: Partial<Record<PlayGame['type'], string>> = {
  maze: 'grid',
  pet: 'pet',
  todo: 'todos',
  battle: 'hp',
};
