import type { Loc, TypeTest } from './schema';

/** The arena's levels and puzzle shape: small, so screens can import it without the puzzles. */
export type ArenaLevel = 'warm-up' | 'medium' | 'hard' | 'extreme';

export const ARENA_LEVELS: readonly ArenaLevel[] = ['warm-up', 'medium', 'hard', 'extreme'];

export interface ArenaPuzzle {
  id: string;
  level: ArenaLevel;
  title: string;
  prompt: Loc;
  hint: Loc;
  starter: string;
  solution: string;
  typeTests: readonly TypeTest[];
  explain: Loc;
}
