import CompileWorker from './compile.worker?worker';
import type { CompileResponse } from './types';
import { msg, type Text } from '../i18n/text';

interface Pending {
  resolve: (value: CompileResponse) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * The first compile in a worker loads esbuild's 12 MB wasm, which can take a
 * long time on a slow phone; after that, compiles are quick.
 */
export const COLD_TIMEOUT_MS = 20_000;
export const WARM_TIMEOUT_MS = 8_000;

let worker: Worker | null = null;
/** True once this worker has compiled something (its wasm is loaded). */
let warm = false;
let sequence = 0;
/** Only when this device cannot create workers at all. */
let unsupported = false;
const pending = new Map<number, Pending>();

function failAll(message: Text): void {
  for (const [, entry] of pending) {
    clearTimeout(entry.timer);
    entry.resolve({ ok: false, fatal: true, problems: [{ text: message }] });
  }
  pending.clear();
}

/**
 * Throw the worker away so the next compile starts a fresh one. A compiler
 * that failed to load, hung, or crashed used to stay broken for the rest of
 * the session; now pressing Run again is a real retry.
 */
function discardWorker(message: Text): void {
  failAll(message);
  worker?.terminate();
  worker = null;
  warm = false;
}

function getWorker(): Worker | null {
  if (unsupported) return null;
  if (worker) return worker;
  if (typeof Worker === 'undefined') {
    unsupported = true;
    return null;
  }
  try {
    const instance = new CompileWorker();
    instance.onmessage = (event: MessageEvent<{ id: number } & CompileResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      clearTimeout(entry.timer);
      entry.resolve(event.data);
      if (event.data.fatal) discardWorker(msg('runner.compilerStopped'));
      else warm = true;
    };
    instance.onerror = (event: ErrorEvent) => {
      // Reported to the learner as "checks are paused"; not an app crash.
      event.preventDefault();
      if (worker === instance) discardWorker(msg('runner.compilerCouldNotStart'));
    };
    worker = instance;
  } catch {
    unsupported = true;
    return null;
  }
  return worker;
}

/**
 * Compile TypeScript to runnable JavaScript. Resolves with `fatal` set when the
 * compiler itself cannot run, which is how the UI tells "the checker is
 * paused" apart from a mistake in the learner's code.
 */
export function compileTs(code: string, timeoutMs?: number): Promise<CompileResponse> {
  const instance = getWorker();
  if (!instance) {
    return Promise.resolve({
      ok: false,
      fatal: true,
      problems: [{ text: msg('runner.compilerMissing') }],
    });
  }

  const limit = timeoutMs ?? (warm ? WARM_TIMEOUT_MS : COLD_TIMEOUT_MS);
  const id = (sequence += 1);
  return new Promise<CompileResponse>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ ok: false, fatal: true, problems: [{ text: msg('runner.compilerSlow') }] });
      // A compiler that stopped answering is not trusted with the next run.
      if (worker === instance) discardWorker(msg('runner.compilerSlow'));
    }, limit);

    pending.set(id, { resolve, timer });
    instance.postMessage({ id, code });
  });
}

/** Test-only. */
export function resetCompilerForTests(): void {
  pending.forEach((entry) => clearTimeout(entry.timer));
  pending.clear();
  worker?.terminate();
  worker = null;
  warm = false;
  unsupported = false;
}
