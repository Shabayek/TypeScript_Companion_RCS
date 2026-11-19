import type { Engine, TestCase } from '../content/schema';
import type { TestResult } from './types';
import { msg, type Text } from '../i18n/text';

export interface SandboxOutcome {
  logs: string[];
  results: TestResult[];
  error?: Text;
  timedOut: boolean;
  loadError?: Text;
  /** Things the learner should know about the run (output cut off, timers still waiting). */
  notes: Text[];
}

/**
 * The sandbox program is plain JavaScript running in a throwaway worker, with
 * no access to the app's wording. It reports its own situations as tokens
 * (`@cutoff:1000`), turned into messages here. Anything else — the learner's
 * own error — is kept as it was.
 */
export function sandboxText(raw: string): Text {
  if (raw.startsWith('@cutoff:')) return msg('runner.cutoff', { lines: Number(raw.slice(8)) || 0 });
  if (raw === '@timers') return msg('runner.timersWaiting');
  if (raw === '@waiting') return msg('runner.stillWaiting');
  if (raw === '@not-finished') return msg('runner.notFinished');
  return raw;
}

/** Messages the sandbox worker sends to the page. */
export type SandboxMessage =
  | { type: 'log'; line: string }
  | { type: 'done'; results: TestResult[]; error: string | null; notes: string[] };

/**
 * Output limits. Without them a print loop filled the worker's memory for the
 * whole time limit, and a large finite loop froze the page while it rendered
 * hundreds of thousands of lines.
 */
export const OUTPUT_LIMITS = {
  maxLines: 1000,
  maxChars: 100_000,
  maxLineChars: 2000,
} as const;

/**
 * Shares of the time limit. Until `settle`, the sandbox waits for the
 * program's timers and promises; checks must finish by `checks`. Both end
 * before the page's hard limit, so results arrive instead of a timeout.
 */
export const TIME_SHARES = { settle: 0.7, checks: 0.9 } as const;

const BLOCKED_GLOBALS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'indexedDB',
  'Worker',
  'SharedWorker',
  'BroadcastChannel',
  'caches',
  'WebTransport',
  'RTCPeerConnection',
  // Captured first for the runner's own use, then hidden from learner code.
  'postMessage',
];

/**
 * What a Classic device lacks: JavaScript from ES2022 on, and
 * `structuredClone`. In Classic mode the sandbox removes these before the
 * learner's code runs, so a new phone set to Classic (or the content check)
 * behaves like an old one.
 */
export const MODERN_BUILT_INS: readonly { owner: string; names: readonly string[] }[] = [
  { owner: 'Array.prototype', names: ['at', 'findLast', 'findLastIndex', 'toSorted', 'toReversed', 'toSpliced', 'with'] },
  { owner: 'String.prototype', names: ['at', 'isWellFormed', 'toWellFormed'] },
  {
    owner: 'Object.getPrototypeOf(Int8Array.prototype)',
    names: ['at', 'findLast', 'findLastIndex', 'toSorted', 'toReversed', 'with'],
  },
  { owner: 'Object', names: ['hasOwn', 'groupBy'] },
  { owner: 'Map', names: ['groupBy'] },
  { owner: 'Promise', names: ['withResolvers'] },
  { owner: 'Array', names: ['fromAsync'] },
  { owner: 'self', names: ['structuredClone'] },
];

function classicRuntime(): string {
  return MODERN_BUILT_INS.map(
    ({ owner, names }) => `
    try {
      var __tscOwner = ${owner};
      ${JSON.stringify(names)}.forEach(function (name) { try { delete __tscOwner[name]; } catch (error) { /* keep */ } });
    } catch (error) { /* Not in this engine at all. */ }
  `,
  ).join('\n');
}

function formatValueExpression(): string {
  return `
    function __tscShow(value) {
      if (typeof value === 'string') return value;
      if (value === undefined) return 'undefined';
      if (value === null) return 'null';
      if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
      if (typeof value === 'function') return '[function ' + (value.name || 'anonymous') + ']';
      if (typeof value === 'symbol') return value.toString();
      try { var json = __tscStringify(value); return json === undefined ? String(value) : json; } catch (error) { return String(value); }
    }
    function __tscSame(got, expected) {
      return __tscShow(got).trim().replace(/[ \\t]+/g, ' ') === expected.trim().replace(/[ \\t]+/g, ' ');
    }
  `;
}

/**
 * The sandbox is a throwaway worker built from a Blob. Learner code is
 * *source*, never evaluated by the app: it is placed inside the worker body,
 * so there is no eval and no `unsafe-eval` requirement.
 *
 * Layout of the generated program:
 *
 *   (function runner() {            // logging with limits, timers, formatting
 *     self.__tscBoot = (factory) => { delete self.__tscBoot; run(factory(...)); };
 *   })();
 *   __tscBoot(function (console, module, exports, require) {
 *     return async function program() {
 *       <learner code>
 *       return { __tscChecks: [() => (<test call>), ...] };  // same scope as the learner's names
 *     };
 *   });
 *
 * The checks used to run *outside* the learner's function, where none of the
 * learner's declarations exist, so every graded exercise failed with
 * "X is not defined" — even the reference solutions.
 *
 * The learner's function can see only what it is handed, not the runner's
 * internals: an earlier layout nested it inside the runner, so code could
 * reach `__tscPost` or replace the comparison function. What remains possible
 * is deliberately rewriting shared built-ins (`Array.prototype`, …) in the
 * same JavaScript realm; grading is feedback for the learner, not an exam.
 *
 * The worker is terminated when it answers or when the page's timeout fires,
 * which is what stops `while (true) {}` from freezing the app. Output lines are
 * streamed as they are printed, so a program that never ends still shows what
 * it printed before it was stopped.
 */
export function buildSandboxSource(
  js: string,
  tests: readonly TestCase[],
  timeoutMs: number,
  engine: Engine = 'modern',
): string {
  const neutralise = BLOCKED_GLOBALS.map(
    (name) => `
    try {
      Object.defineProperty(self, ${JSON.stringify(name)}, {
        value: undefined, writable: false, configurable: false,
      });
    } catch (error) { /* Non-configurable in this engine; nothing to do. */ }
  `,
  ).join('\n');

  const checkFunctions = tests.map((test) => `function () { return (${test.call}); }`).join(',\n');
  const checkInfo = JSON.stringify(tests.map((test) => ({ name: test.name, expect: test.expect })));
  const settleMs = Math.round(timeoutMs * TIME_SHARES.settle);
  const checksMs = Math.round(timeoutMs * TIME_SHARES.checks);

  return `
(function () {
  'use strict';
  var __tscPost = self.postMessage.bind(self);
  /* Built-ins the runner uses after the learner's code has run. */
  var __tscPromise = Promise;
  var __tscRace = Promise.race.bind(Promise);
  var __tscStringify = JSON.stringify;
  var __tscIsArray = Array.isArray;
  var __tscNow = Date.now.bind(Date);
  var __tscStarted = __tscNow();
  var __tscSettleBy = __tscStarted + ${settleMs};
  var __tscChecksBy = __tscStarted + ${checksMs};
  var __tscSetTimeout = self.setTimeout.bind(self);
  var __tscClearTimeout = self.clearTimeout.bind(self);
  var __tscSetInterval = self.setInterval.bind(self);
  var __tscClearInterval = self.clearInterval.bind(self);
  var __tscNotes = [];
  var __tscError = null;
  ${formatValueExpression()}

  function __tscDescribeError(error) {
    return error && error.name ? error.name + ': ' + error.message : String(error);
  }
  function __tscRecordError(error) {
    if (__tscError === null) __tscError = __tscDescribeError(error);
  }

  /* Output, within limits. */
  var __tscLines = 0;
  var __tscChars = 0;
  var __tscCut = false;
  function __tscLog(line) {
    if (__tscCut) return;
    if (line.length > ${OUTPUT_LIMITS.maxLineChars}) line = line.slice(0, ${OUTPUT_LIMITS.maxLineChars}) + ' … (line shortened)';
    if (__tscLines >= ${OUTPUT_LIMITS.maxLines} || __tscChars + line.length > ${OUTPUT_LIMITS.maxChars}) {
      __tscCut = true;
      __tscNotes.push('@cutoff:' + __tscLines);
      return;
    }
    __tscLines += 1;
    __tscChars += line.length;
    __tscPost({ type: 'log', line: line });
  }
  function __tscFormat(args) {
    return Array.prototype.map.call(args, __tscShow).join(' ');
  }
  var __tscConsole = {
    log: function () { __tscLog(__tscFormat(arguments)); },
    info: function () { __tscLog(__tscFormat(arguments)); },
    warn: function () { __tscLog(__tscFormat(arguments)); },
    error: function () { __tscLog(__tscFormat(arguments)); },
    debug: function () { /* Quiet in the sandbox. */ },
    table: function (value) { __tscLog(__tscShow(value)); },
  };

  /* Timers, tracked so the runner knows when the program has finished. */
  var __tscPending = new Map();
  function __tscGuard(fn, args) {
    if (typeof fn !== 'function') return;
    try { fn.apply(undefined, args); } catch (error) { __tscRecordError(error); }
  }
  self.setTimeout = function (fn, ms) {
    var args = Array.prototype.slice.call(arguments, 2);
    var id = __tscSetTimeout(function () { __tscPending.delete(id); __tscGuard(fn, args); }, ms);
    __tscPending.set(id, 'timeout');
    return id;
  };
  self.setInterval = function (fn, ms) {
    var args = Array.prototype.slice.call(arguments, 2);
    var id = __tscSetInterval(function () { __tscGuard(fn, args); }, ms);
    __tscPending.set(id, 'interval');
    return id;
  };
  self.clearTimeout = function (id) { __tscPending.delete(id); __tscClearTimeout(id); __tscClearInterval(id); };
  self.clearInterval = self.clearTimeout;
  if (typeof self.addEventListener === 'function') {
    self.addEventListener('unhandledrejection', function (event) {
      event.preventDefault();
      __tscLog('Uncaught (in promise) ' + __tscDescribeError(event.reason));
    });
    self.addEventListener('error', function (event) {
      event.preventDefault();
      __tscRecordError(event.error || event.message);
    });
  }

  var __tscModule = { exports: {} };
  function __tscRequire(name) {
    throw new Error('"' + name + '" cannot be imported here. The playground runs one file on its own, so import and require are not available.');
  }
  ${neutralise}
  ${engine === 'classic' ? classicRuntime() : ''}

  var __tscChecks = null;

  function __tscWait(ms) {
    return new __tscPromise(function (resolve) { __tscSetTimeout(resolve, ms); });
  }
  /* Rejects with \`reason\` if \`promise\` has not settled by \`deadline\`. */
  function __tscUntil(promise, deadline, reason) {
    return __tscRace([
      promise,
      new __tscPromise(function (resolve, reject) {
        __tscSetTimeout(function () { reject(reason); }, Math.max(0, deadline - __tscNow()));
      }),
    ]);
  }
  var __tscTimeUp = {};

  /* Give pending timers and promise callbacks their chance to run. */
  async function __tscSettle() {
    await __tscWait(0);
    while (__tscPending.size > 0 && __tscNow() < __tscSettleBy) await __tscWait(10);
    if (__tscPending.size > 0) {
      __tscNotes.push('@timers');
    }
    // Browsers report an unhandled promise rejection a task or two later;
    // give it a moment so "Uncaught (in promise)" is shown, not lost.
    await __tscWait(15);
  }

  var __tscInfo = ${checkInfo};
  async function __tscRunChecks() {
    var results = [];
    if (__tscError !== null || __tscInfo.length === 0) return results;
    if (__tscChecks === null) {
      __tscError = '@not-finished';
      return results;
    }
    for (var i = 0; i < __tscInfo.length; i += 1) {
      var info = __tscInfo[i];
      try {
        var value = __tscChecks[i]();
        if (value && typeof value.then === 'function') {
          value = await __tscUntil(value, __tscChecksBy, new Error('it did not finish in time'));
        }
        results.push({ name: info.name, pass: __tscSame(value, info.expect), got: __tscShow(value), expected: info.expect });
      } catch (error) {
        results.push({ name: info.name, pass: false, got: 'threw ' + (error && error.message ? error.message : String(error)), expected: info.expect });
      }
    }
    return results;
  }

  function __tscRun(program) {
    __tscUntil(program(), __tscSettleBy, __tscTimeUp)
      .then(
        function (result) {
          if (result && __tscIsArray(result.__tscChecks)) __tscChecks = result.__tscChecks;
        },
        function (error) {
          if (error === __tscTimeUp) {
            __tscNotes.push('@waiting');
          } else {
            __tscRecordError(error);
          }
        }
      )
      .then(__tscSettle)
      .then(__tscRunChecks)
      .then(
        function (results) { __tscPost({ type: 'done', results: results, error: __tscError, notes: __tscNotes }); },
        function (error) { __tscRecordError(error); __tscPost({ type: 'done', results: [], error: __tscError, notes: __tscNotes }); }
      );
  }

  /* One-time hook for the learner's program; gone before that program runs. */
  self.__tscBoot = function (factory) {
    delete self.__tscBoot;
    __tscRun(factory(__tscConsole, __tscModule, __tscModule.exports, __tscRequire));
  };
})();

/* The learner's program. It sees only these four names and the globals. */
__tscBoot(function (console, module, exports, require) {
  'use strict';
  return async function () {
${js}
;return { __tscChecks: [
${checkFunctions}
] };
  };
});
`;
}

function isSandboxMessage(value: unknown): value is SandboxMessage {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return type === 'log' || type === 'done';
}

export function runInSandbox(
  js: string,
  tests: readonly TestCase[],
  timeoutMs: number,
  engine: Engine = 'modern',
): Promise<SandboxOutcome> {
  return new Promise<SandboxOutcome>((resolve) => {
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined') {
      resolve({ logs: [], results: [], timedOut: false, loadError: msg('runner.noWorkers'), notes: [] });
      return;
    }

    let settled = false;
    let url = '';
    let worker: Worker | null = null;
    const logs: string[] = [];

    const finish = (outcome: SandboxOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker?.terminate();
      if (url) URL.revokeObjectURL(url);
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      finish({
        // What it printed before it was stopped: often the best clue to a loop
        // that never ends.
        logs: [...logs],
        results: [],
        timedOut: true,
        error: msg('runner.stillRunning', { seconds: Math.round(timeoutMs / 100) / 10 }),
        notes: [],
      });
    }, timeoutMs);

    try {
      const blob = new Blob([buildSandboxSource(js, tests, timeoutMs, engine)], { type: 'text/javascript' });
      url = URL.createObjectURL(blob);
      worker = new Worker(url, { name: 'ts-companion-sandbox' });

      worker.onmessage = (event: MessageEvent<unknown>) => {
        const data = event.data;
        if (!isSandboxMessage(data)) return;
        if (data.type === 'log') {
          if (logs.length < OUTPUT_LIMITS.maxLines) logs.push(String(data.line));
          return;
        }
        finish({
          logs: [...logs],
          results: Array.isArray(data.results) ? data.results : [],
          ...(data.error ? { error: sandboxText(String(data.error)) } : {}),
          timedOut: false,
          notes: Array.isArray(data.notes) ? data.notes.map((note) => sandboxText(String(note))) : [],
        });
      };
      worker.onerror = (event: ErrorEvent) => {
        // The learner's own error (usually code that cannot start), reported in
        // the result panel. Mark it handled so it does not also surface as an
        // uncaught app error.
        event.preventDefault();
        finish({
          logs: [...logs],
          results: [],
          timedOut: false,
          loadError: event.message || msg('runner.couldNotStart'),
          notes: [],
        });
      };
    } catch (error) {
      finish({
        logs: [],
        results: [],
        timedOut: false,
        loadError: error instanceof Error ? error.message : msg('runner.sandboxFailed'),
        notes: [],
      });
    }
  });
}
