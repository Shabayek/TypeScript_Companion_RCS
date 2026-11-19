import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Reply = { ok: boolean; fatal?: boolean; code?: string; problems?: { text: string }[] } | 'crash' | 'silent';

const fake = vi.hoisted(() => {
  /** Each created worker answers with the next scripted reply. */
  const script: unknown[] = [];
  const created: { terminated: boolean }[] = [];

  class FakeCompileWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    terminated = false;
    constructor() {
      created.push(this);
    }
    postMessage({ id }: { id: number }) {
      const reply = (script.shift() ?? { ok: true, code: '' }) as Record<string, unknown> | string;
      if (reply === 'silent') return;
      queueMicrotask(() => {
        if (reply === 'crash') this.onerror?.({ preventDefault: () => undefined } as unknown as ErrorEvent);
        else this.onmessage?.({ data: { id, ...(reply as object) } } as MessageEvent);
      });
    }
    terminate() {
      this.terminated = true;
    }
  }
  return { script, created, FakeCompileWorker };
});
const script = fake.script as Reply[];
const created = fake.created;

vi.mock('../src/runner/compile.worker?worker', () => ({ default: fake.FakeCompileWorker }));

import {
  COLD_TIMEOUT_MS,
  WARM_TIMEOUT_MS,
  compileTs,
  resetCompilerForTests,
} from '../src/runner/compileClient';

describe('compiler recovery', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', fake.FakeCompileWorker);
    resetCompilerForTests();
    script.length = 0;
    created.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reuses one worker while it works', async () => {
    script.push({ ok: true, code: 'a' }, { ok: true, code: 'b' });
    expect(await compileTs('a')).toMatchObject({ ok: true, code: 'a' });
    expect(await compileTs('b')).toMatchObject({ ok: true, code: 'b' });
    expect(created).toHaveLength(1);
  });

  it('starts a fresh compiler after it failed to load, so Run again is a real retry', async () => {
    script.push({ ok: false, fatal: true, problems: [{ text: 'could not start (Failed to fetch)' }] });
    expect(await compileTs('x')).toMatchObject({ ok: false, fatal: true });
    expect(created[0]?.terminated).toBe(true);

    script.push({ ok: true, code: 'ran' });
    expect(await compileTs('x')).toMatchObject({ ok: true, code: 'ran' });
    expect(created).toHaveLength(2);
  });

  it('reports a compile error in the code as not fatal, and keeps the compiler', async () => {
    script.push({ ok: false, problems: [{ text: 'Expected ";"' }] });
    const outcome = await compileTs('bad');
    expect(outcome).toMatchObject({ ok: false });
    expect(outcome.fatal).toBeUndefined();
    expect(created[0]?.terminated).toBe(false);

    script.push({ ok: true, code: 'fixed' });
    expect(await compileTs('fixed')).toMatchObject({ ok: true });
    expect(created).toHaveLength(1);
  });

  it('recovers from a crashed compiler worker', async () => {
    script.push('crash');
    expect(await compileTs('x')).toMatchObject({ ok: false, fatal: true });
    script.push({ ok: true, code: 'ok' });
    expect(await compileTs('x')).toMatchObject({ ok: true });
    expect(created).toHaveLength(2);
  });

  it('gives the first (cold) compile longer than later ones, and replaces a hung compiler', async () => {
    vi.useFakeTimers();
    script.push('silent');
    const cold = compileTs('x');
    await vi.advanceTimersByTimeAsync(WARM_TIMEOUT_MS + 100);
    let settled = false;
    void cold.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(COLD_TIMEOUT_MS);
    expect(await cold).toMatchObject({ ok: false, fatal: true });
    expect(created[0]?.terminated).toBe(true);

    script.push({ ok: true, code: 'warm now' });
    expect(await compileTs('x')).toMatchObject({ ok: true });
    expect(created).toHaveLength(2);
  });
});
