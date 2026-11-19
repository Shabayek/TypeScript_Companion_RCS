import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebouncedSaver, createLocalAdapter, isPersistentStorageAvailable } from '../src/storage/local';

describe('local storage adapter', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('stores, reads and removes values', async () => {
    const adapter = createLocalAdapter();
    await adapter.set('key', 'value');
    expect(await adapter.get('key')).toBe('value');
    expect(window.localStorage.getItem('key')).toBe('value');

    await adapter.remove('key');
    expect(await adapter.get('key')).toBeNull();
    expect(window.localStorage.getItem('key')).toBeNull();
  });

  it('reports missing keys as null', async () => {
    const adapter = createLocalAdapter();
    expect(await adapter.get('never-written')).toBeNull();
  });

  it('keeps working in memory when the browser blocks storage', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });
    expect(isPersistentStorageAvailable()).toBe(false);

    const adapter = createLocalAdapter();
    await adapter.set('key', 'value');
    expect(await adapter.get('key')).toBe('value');

    await adapter.remove('key');
    expect(await adapter.get('key')).toBeNull();
  });
});

describe('debounced saver', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes once for a burst of calls, with the last value', () => {
    const write = vi.fn();
    const save = createDebouncedSaver(write, 400);

    save('first');
    save('second');
    save('third');
    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(399);
    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('third');
  });

  it('starts a new window after a flush', () => {
    const write = vi.fn();
    const save = createDebouncedSaver(write, 100);

    save('one');
    vi.advanceTimersByTime(100);
    save('two');
    vi.advanceTimersByTime(100);

    expect(write.mock.calls).toEqual([['one'], ['two']]);
  });
});

describe('debounced saver controls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flush writes the queued value immediately, once', () => {
    const write = vi.fn();
    const save = createDebouncedSaver(write, 400);

    save('queued');
    expect(save.pending()).toBe(true);
    save.flush();
    expect(write.mock.calls).toEqual([['queued']]);
    expect(save.pending()).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('flush with nothing queued writes nothing', () => {
    const write = vi.fn();
    const save = createDebouncedSaver(write, 400);
    save.flush();
    expect(write).not.toHaveBeenCalled();
  });

  it('cancel drops the queued value', () => {
    const write = vi.fn();
    const save = createDebouncedSaver(write, 400);

    save('stale');
    save.cancel();
    vi.advanceTimersByTime(1000);
    expect(write).not.toHaveBeenCalled();

    save('fresh');
    vi.advanceTimersByTime(400);
    expect(write.mock.calls).toEqual([['fresh']]);
  });
});

describe('local storage adapter failures and sync', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('rejects a write that durable storage refuses, so the app can warn', async () => {
    const adapter = createLocalAdapter();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    await expect(adapter.set('key', 'value')).rejects.toThrow('full');
  });

  it('reports changes made by another tab, for its own key only', () => {
    const adapter = createLocalAdapter();
    const seen: (string | null)[] = [];
    const stop = adapter.subscribe?.('mine', (value) => seen.push(value));

    window.dispatchEvent(
      new StorageEvent('storage', { key: 'mine', newValue: 'from-other-tab', storageArea: window.localStorage }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'other', newValue: 'ignored', storageArea: window.localStorage }),
    );
    stop?.();
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'mine', newValue: 'after-stop', storageArea: window.localStorage }),
    );

    expect(seen).toEqual(['from-other-tab']);
  });
});
