/**
 * Runs the app's real sandbox program (src/runner/sandbox.ts) in Node, for the
 * content validator and the tests.
 *
 * The browser runs the generated program in a Worker; here it runs in a
 * `node:vm` context that provides the few things a worker would: `self`,
 * `postMessage`, and timers. Everything else — the scope the checks run in,
 * output limits, waiting for timers and promises — is the same code. Grading
 * content with a *different* pipeline is how every graded exercise shipped
 * broken without a single failing test.
 */

import vm from 'node:vm';
import type { Engine, TestCase } from '../src/content/schema';
import { buildSandboxSource, sandboxText, type SandboxOutcome } from '../src/runner/sandbox';

export function runSandboxInNode(
  js: string,
  tests: readonly TestCase[],
  timeoutMs = 2000,
  /** `classic` removes ES2022+ built-ins first, like an older phone's engine. */
  engine: Engine = 'modern',
): Promise<SandboxOutcome> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const intervals = new Set<ReturnType<typeof setInterval>>();
    let settled = false;

    const finish = (outcome: SandboxOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardLimit);
      timers.forEach((timer) => clearTimeout(timer));
      intervals.forEach((interval) => clearInterval(interval));
      resolve(outcome);
    };

    const hardLimit = setTimeout(() => {
      finish({ logs: [...logs], results: [], timedOut: true, notes: [] });
    }, timeoutMs);
    const deadline = Date.now() + timeoutMs;

    /**
     * Runs a callback of the program inside the context, under the time
     * limit. In a browser the worker is simply terminated; here, a loop that
     * never ends inside a timer or a promise callback (a check that spreads an
     * endless generator, say) would otherwise block Node, or fill its memory.
     * The context drains its own promise jobs after each evaluation
     * (`microtaskMode: 'afterEvaluate'`), so they are limited too.
     */
    const runLimited = (fn: () => void) => {
      if (settled) return;
      context.__tscNodeTick = fn;
      try {
        vm.runInContext('__tscNodeTick()', context, { timeout: Math.max(1, deadline - Date.now()) });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/timed out/i.test(message)) finish({ logs: [...logs], results: [], timedOut: true, notes: [] });
      }
    };

    const context: Record<string, unknown> = {
      postMessage(message: { type: string; line?: string; results?: unknown; error?: unknown; notes?: unknown }) {
        if (message.type === 'log') {
          logs.push(String(message.line));
          return;
        }
        finish({
          logs: [...logs],
          results: (message.results as SandboxOutcome['results']) ?? [],
          ...(message.error ? { error: sandboxText(String(message.error)) } : {}),
          timedOut: false,
          notes: ((message.notes as unknown[]) ?? []).map((note) => sandboxText(String(note))),
        });
      },
      setTimeout(fn: () => void, ms?: number) {
        const timer = setTimeout(() => {
          timers.delete(timer);
          runLimited(fn);
        }, ms);
        timers.add(timer);
        return timer;
      },
      clearTimeout(timer: ReturnType<typeof setTimeout>) {
        timers.delete(timer);
        clearTimeout(timer);
      },
      setInterval(fn: () => void, ms?: number) {
        const interval = setInterval(() => runLimited(fn), ms);
        intervals.add(interval);
        return interval;
      },
      clearInterval(interval: ReturnType<typeof setInterval>) {
        intervals.delete(interval);
        clearInterval(interval);
      },
    };
    // A worker has structuredClone; a bare vm context does not.
    context.structuredClone = structuredClone;
    context.self = context;
    vm.createContext(context, { microtaskMode: 'afterEvaluate' });

    try {
      vm.runInContext(buildSandboxSource(js, tests, timeoutMs, engine), context, { timeout: timeoutMs });
    } catch (error) {
      // A synchronous loop that never ends, or code that cannot start.
      const message = error instanceof Error ? error.message : String(error);
      if (/timed out/i.test(message)) finish({ logs: [...logs], results: [], timedOut: true, notes: [] });
      else finish({ logs: [...logs], results: [], timedOut: false, loadError: message, notes: [] });
    }
  });
}
