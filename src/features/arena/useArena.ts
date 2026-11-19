import { useEffect, useState } from 'react';
import type { ArenaPuzzle } from '../../content/arenaLevels';

type ArenaLoad = { status: 'loading' } | { status: 'ready'; puzzles: readonly ArenaPuzzle[] } | { status: 'failed' };

let cache: readonly ArenaPuzzle[] | null = null;

/** The arena's puzzles, downloaded the first time the arena opens. */
export function useArena(): ArenaLoad {
  const [load, setLoad] = useState<ArenaLoad>(() => (cache ? { status: 'ready', puzzles: cache } : { status: 'loading' }));
  useEffect(() => {
    if (cache) return;
    let alive = true;
    import('../../content/arena').then(
      (module) => {
        cache = module.ARENA;
        if (alive) setLoad({ status: 'ready', puzzles: module.ARENA });
      },
      () => {
        if (alive) setLoad({ status: 'failed' });
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return load;
}
