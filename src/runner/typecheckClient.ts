import TypeCheckWorker from './typecheck.worker?worker';
import type { CheckOptions, TypeAnswer, TypeProblem, TypeSpan, TypeTestOutcome } from './typecheckCore';
import type { TypeCheckAnswers, TypeCheckRequest } from './typecheckProtocol';
import type { TypeTest } from '../content/schema';
import { msg, type Text } from '../i18n/text';

/** A question answered by the checker, or why it could not be. */
export type Checked<T> = { ok: true; value: T } | { ok: false; unavailable: true; reason: Text };

/** The result of a type check. `unavailable` means the checker could not run. */
export type TypeCheckResult = { ok: true; problems: TypeProblem[] } | { ok: false; unavailable: true; reason: Text };

/** Loading TypeScript the first time can take a while on a phone. */
export const TYPECHECK_COLD_TIMEOUT_MS = 30_000;
export const TYPECHECK_WARM_TIMEOUT_MS = 10_000;

let worker: Worker | null = null;
let warm = false;
let sequence = 0;
const pending = new Map<number, { resolve: (result: Checked<unknown>) => void; timer: ReturnType<typeof setTimeout> }>();

function failAll(reason: Text): void {
  for (const [, entry] of pending) {
    clearTimeout(entry.timer);
    entry.resolve({ ok: false, unavailable: true, reason });
  }
  pending.clear();
}

/** Throw a broken or stuck worker away; the next check starts a new one. */
function discard(reason: Text): void {
  failAll(reason);
  worker?.terminate();
  worker = null;
  warm = false;
}

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') return null;
  try {
    const instance = new TypeCheckWorker();
    instance.onmessage = (event: MessageEvent<{ id: number; ok: boolean; value?: unknown; error?: string }>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      clearTimeout(entry.timer);
      if (event.data.ok) {
        warm = true;
        entry.resolve({ ok: true, value: event.data.value });
      } else {
        entry.resolve({ ok: false, unavailable: true, reason: event.data.error ?? msg('runner.typeCheckerFailed') });
      }
    };
    instance.onerror = (event: ErrorEvent) => {
      event.preventDefault();
      if (worker === instance) discard(msg('runner.typeCheckerCouldNotStart'));
    };
    worker = instance;
    return worker;
  } catch {
    return null;
  }
}

/** Asks the worker one question. Never rejects. */
function ask<K extends TypeCheckRequest['op']>(
  request: Extract<TypeCheckRequest, { op: K }>,
): Promise<Checked<TypeCheckAnswers[K]>> {
  const instance = getWorker();
  if (!instance) {
    return Promise.resolve({ ok: false, unavailable: true, reason: msg('runner.typeCheckerMissing') });
  }
  const id = (sequence += 1);
  const limit = warm ? TYPECHECK_WARM_TIMEOUT_MS : TYPECHECK_COLD_TIMEOUT_MS;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ ok: false, unavailable: true, reason: msg('runner.typeCheckerSlow') });
      if (worker === instance) discard(msg('runner.typeCheckerSlow'));
    }, limit);
    pending.set(id, { resolve: resolve as (result: Checked<unknown>) => void, timer });
    instance.postMessage({ ...request, id });
  });
}

/** Checks the learner's code with TypeScript's type checker. Never rejects. */
export async function typeCheck(code: string, options: CheckOptions = {}): Promise<TypeCheckResult> {
  const result = await ask({ op: 'check', code, options });
  return result.ok ? { ok: true, problems: result.value } : result;
}

/** The type of every name in some code (tap-to-see-type). */
export function inspectTypes(code: string, options: CheckOptions = {}): Promise<Checked<TypeSpan[]>> {
  return ask({ op: 'inspect', code, options });
}

/** Whether a typed answer is exactly the type of `target`. */
export function matchType(code: string, target: string, answer: string, options: CheckOptions = {}): Promise<Checked<TypeAnswer>> {
  return ask({ op: 'matchType', code, target, answer, options });
}

/** A type challenge's tests against the learner's code. */
export function runTypeTests(code: string, tests: readonly TypeTest[], options: CheckOptions = {}): Promise<Checked<TypeTestOutcome>> {
  return ask({ op: 'typeTests', code, tests, options });
}

/** Test-only. */
export function resetTypeCheckerForTests(): void {
  pending.forEach((entry) => clearTimeout(entry.timer));
  pending.clear();
  worker?.terminate();
  worker = null;
  warm = false;
}
