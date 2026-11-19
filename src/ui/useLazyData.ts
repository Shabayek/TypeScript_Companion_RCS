import { useEffect, useState } from 'react';

const cache = new Map<() => Promise<unknown>, unknown>();

/**
 * Data that lives in its own download (reference content such as the
 * cheatsheet), so it does not slow down the app's start. `null` until it has
 * loaded; loaded data is kept for the rest of the session.
 *
 * When the loader changes (another language), the previous data stays on
 * screen until the new data is ready, then swaps — no blank frame.
 */
export function useLazyData<T>(load: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(() => (cache.has(load) ? (cache.get(load) as T) : null));
  useEffect(() => {
    if (cache.has(load)) {
      setData(cache.get(load) as T);
      return;
    }
    let alive = true;
    load().then(
      (value) => {
        cache.set(load, value);
        if (alive) setData(value);
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [load]);
  return data;
}
