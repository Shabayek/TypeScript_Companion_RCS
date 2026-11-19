import type { StorageAdapter } from './types';

/**
 * LocalStorage with a memory fallback, because private browsing, quota limits
 * and WebView quirks all exist. If storage is unavailable the app still works
 * for the session and says so in Settings.
 */
export function createLocalAdapter(): StorageAdapter {
  const memory = new Map<string, string>();
  let available = false;

  try {
    const probe = '__ts_companion_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }

  return {
    async get(key) {
      if (!available) return memory.get(key) ?? null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memory.get(key) ?? null;
      }
    },
    async set(key, value) {
      memory.set(key, value);
      // Storage known to be unavailable: memory-only is the expected mode, and
      // Settings already says so. Nothing new to report.
      if (!available) return;
      // Storage is normally available but refused this write (quota, or the
      // browser blocked it mid-session). The in-memory copy keeps the session
      // alive; rejecting lets the app tell the learner instead of pretending.
      window.localStorage.setItem(key, value);
    },
    async remove(key) {
      memory.delete(key);
      if (!available) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore: nothing else we can do, and the UI never promises otherwise.
      }
    },
    subscribe(key, onChange) {
      // `storage` fires only in *other* tabs of the same origin, which is
      // exactly the case where two copies of the app would overwrite each other.
      const listener = (event: StorageEvent) => {
        if (event.storageArea !== window.localStorage || event.key !== key) return;
        onChange(event.newValue);
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    },
  };
}

export function isPersistentStorageAvailable(): boolean {
  try {
    const probe = '__ts_companion_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export interface DebouncedSaver {
  /** Queue a value; bursts are coalesced into one write per window. */
  (value: string): void;
  /** Write the queued value now, if there is one. */
  flush(): void;
  /** Drop the queued value without writing it. */
  cancel(): void;
  /** True while a value is queued and not yet written. */
  pending(): boolean;
}

/** A saver that coalesces bursts of writes into one per `delay` ms. */
export function createDebouncedSaver(
  write: (value: string) => void,
  delay = 400,
): DebouncedSaver {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let queued: string | null = null;

  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const flush = () => {
    clear();
    const next = queued;
    queued = null;
    if (next !== null) write(next);
  };

  const save = ((value: string) => {
    queued = value;
    if (timer !== null) return;
    timer = setTimeout(flush, delay);
  }) as DebouncedSaver;

  save.flush = flush;
  save.cancel = () => {
    clear();
    queued = null;
  };
  save.pending = () => queued !== null;
  return save;
}
