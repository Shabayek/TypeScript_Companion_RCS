import type { CompilerFlags, Engine, TestCase, TypeTest } from '../content/schema';
import { compileTs } from './compileClient';
import { runInSandbox } from './sandbox';
import { CURLY_QUOTES_NOTE, hasCurlyQuotes, straightenQuotes } from './friendly';
import { runTypeTests, typeCheck } from './typecheckClient';
import { msg, type Text } from '../i18n/text';
import {
  compileFailure,
  describe,
  runtimeFailure,
  timeoutFailure,
  unavailable,
  withNotes,
  withTypeProblems,
  describeTypeTests,
  type GradeOutcome,
} from './grade';
import { DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS, type RunOptions, type RunResult } from './types';

/** Compile, then run everything in a disposable worker. */
export async function runProgram(code: string, options: RunOptions = {}): Promise<RunResult> {
  const tests = options.tests ?? [];
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 200), MAX_TIMEOUT_MS);

  const before: Text[] = [];
  let source = code;
  let compiled = await compileTs(code);
  // Phone keyboards type curly quotes, which code cannot use. Only when the
  // code does not compile as written is it retried with straight quotes, so
  // curly quotes used on purpose inside text are left alone.
  if (!compiled.ok && !compiled.fatal && hasCurlyQuotes(code)) {
    const retry = await compileTs(straightenQuotes(code));
    if (retry.ok) {
      compiled = retry;
      source = straightenQuotes(code);
      before.push(CURLY_QUOTES_NOTE);
    }
  }
  if (!compiled.ok || typeof compiled.code !== 'string') {
    if (compiled.fatal) {
      return { status: 'unavailable', logs: [], tests: [], problems: compiled.problems ?? [] };
    }
    return { status: 'compile-error', logs: [], tests: [], problems: compiled.problems ?? [] };
  }

  // TypeScript's type check runs alongside the program, never before it:
  // output appears as fast as ever, and the type verdict joins it.
  const engine = options.engine ?? 'modern';
  const typed =
    options.typeCheck === false ? null : typeCheck(source, { engine, ...(options.flags ? { flags: options.flags } : {}) });
  const outcome = await runInSandbox(compiled.code, tests, timeoutMs, engine);
  const notes = [...before, ...outcome.notes];
  const types = typed ? await typed : null;
  const typeInfo =
    types === null
      ? {}
      : types.ok
        ? { typeProblems: types.problems }
        : { typeProblems: [], typeCheckSkipped: types.reason };

  if (outcome.timedOut) {
    return { status: 'timeout', logs: outcome.logs, tests: [], notes, ...typeInfo };
  }
  if (outcome.loadError) {
    return { status: 'runtime-error', logs: outcome.logs, tests: [], error: outcome.loadError, notes, ...typeInfo };
  }
  if (outcome.error) {
    return { status: 'runtime-error', logs: outcome.logs, tests: outcome.results, error: outcome.error, notes, ...typeInfo };
  }

  return { status: 'ok', logs: outcome.logs, tests: outcome.results, notes, ...typeInfo };
}

/** Which device engine to run and check for, and any per-step compiler flags. */
export interface GradeOptions {
  engine?: Engine;
  flags?: CompilerFlags;
  timeoutMs?: number;
}

/** The function the exercise UI calls. Always resolves to friendly copy. */
export async function gradeCode(
  code: string,
  tests: readonly TestCase[],
  seed = '',
  options: GradeOptions = {},
): Promise<GradeOutcome> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const result = await runProgram(code, {
    tests,
    timeoutMs,
    ...(options.engine ? { engine: options.engine } : {}),
    ...(options.flags ? { flags: options.flags } : {}),
  });
  const skipped = result.typeCheckSkipped
    ? [msg('runner.typeCheckSkipped', { reason: result.typeCheckSkipped })]
    : [];
  const graded = gradeResult(result, seed, timeoutMs);
  // A TypeScript course: the code only counts as solved when its types are
  // right too, not just its output.
  const typed = result.status === 'ok' || result.status === 'runtime-error'
    ? withTypeProblems(graded, result.typeProblems ?? [])
    : graded;
  return withNotes(typed, [...(result.notes ?? []), ...skipped]);
}

/**
 * A type challenge: TypeScript judges each type test; runtime checks, when
 * the step has any, run as well. Always resolves to friendly copy.
 */
export async function gradeTypes(
  code: string,
  typeTests: readonly TypeTest[],
  tests: readonly TestCase[] = [],
  seed = '',
  options: GradeOptions = {},
): Promise<GradeOutcome> {
  const checkOptions = { engine: options.engine ?? 'modern', ...(options.flags ? { flags: options.flags } : {}) };
  const [typed, ran] = await Promise.all([
    runTypeTests(code, typeTests, checkOptions),
    tests.length > 0 ? gradeCode(code, tests, seed, options) : Promise.resolve(null),
  ]);
  if (!typed.ok) return unavailable(typed.reason);
  const outcome = describeTypeTests(typed.value.results, typed.value.problems, seed);
  if (!ran || ran.kind === 'unavailable') return outcome;
  // Both must pass. Runtime problems come after the type verdict.
  if (ran.pass) return { ...outcome, logs: ran.logs };
  return {
    ...outcome,
    kind: ran.kind === 'pass' ? outcome.kind : ran.kind,
    pass: false,
    headline: outcome.pass ? ran.headline : outcome.headline,
    details: [...outcome.details, ...ran.details],
    results: [...outcome.results, ...ran.results],
    logs: ran.logs,
  };
}

function gradeResult(result: RunResult, seed: string, timeoutMs: number): GradeOutcome {
  switch (result.status) {
    case 'unavailable':
      return unavailable(
        result.problems?.[0]?.text ?? msg('runner.compilerNotLoaded'),
      );
    case 'compile-error':
      return compileFailure(result.problems ?? [{ text: msg('runner.couldNotCompile') }]);
    case 'runtime-error':
      return runtimeFailure(result.error ?? msg('runner.threwError'), result.logs);
    case 'timeout':
      return timeoutFailure(timeoutMs / 1000, result.logs);
    default:
      return describe(result.tests, seed, result.logs);
  }
}

export { describe, withNotes, withTypeProblems } from './grade';
export { gradeTypeAnswer, type TypeAnswerVerdict } from './typeAnswer';
export type { GradeOutcome } from './grade';
