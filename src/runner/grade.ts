import { msg, type Msg, type Text } from '../i18n/text';
import type { MessageKey } from '../i18n/messages';
import type { TestResult } from './types';
import { explainMessage } from './friendly';
import { EXPECTED_ERROR, SYNTAX_FIRST, type TypeProblem, type TypeTestResult } from './typecheckCore';

/**
 * Every sentence here is a message key, translated when it is shown (see
 * i18n/text.ts): a result on screen follows the learner's language. What the
 * compiler, the engine or the learner's code said stays as it was written.
 */

/**
 * The lines to show for compile problems: a plain-language explanation first
 * when the message is a classic beginner one, then the compiler's exact words.
 */
export function problemLines(problems: readonly { text: Text; line?: number }[]): Text[] {
  return problems.flatMap((problem): Text[] => {
    const friendly = explainMessage(problem.text);
    const withLine = (text: Text): Text => (problem.line ? msg('runner.withLine', { text, line: problem.line }) : text);
    return friendly ? [withLine(friendly), msg('runner.compilerSaid', { text: problem.text })] : [withLine(problem.text)];
  });
}

/** The lines to show for type problems: plain words first, then TypeScript's. */
export function typeLines(problems: readonly { text: string; line: number }[]): Text[] {
  return problems.flatMap((problem): Text[] => {
    const friendly = explainMessage(problem.text);
    return friendly
      ? [msg('runner.withLine', { text: friendly, line: problem.line }), msg('runner.typescriptSaid', { text: problem.text })]
      : [msg('runner.typescriptLine', { text: problem.text, line: problem.line })];
  });
}

/**
 * Adds what the type checker found. Type problems mean "not yet", even when
 * every check passes: the types are part of the answer in this course.
 */
export function withTypeProblems(outcome: GradeOutcome, problems: readonly { text: string; line: number }[]): GradeOutcome {
  if (problems.length === 0) return outcome;
  return {
    ...outcome,
    kind: outcome.kind === 'error' ? 'error' : 'fail',
    pass: false,
    headline: outcome.kind === 'pass' ? msg('runner.typeProblemsAfterPass', { count: problems.length }) : outcome.headline,
    details: [...typeLines(problems), ...outcome.details],
  };
}

/** The lines to show for an error while the program ran. */
export function runtimeLines(message: Text): Text[] {
  const friendly = explainMessage(message);
  return friendly ? [friendly, msg('runner.exactError', { text: message })] : [message];
}

export type GradeKind = 'pass' | 'fail' | 'error' | 'timeout' | 'unavailable';

export interface GradeOutcome {
  kind: GradeKind;
  pass: boolean;
  /** One friendly sentence to lead with. */
  headline: Text;
  /** One line per check that needs attention. */
  details: Text[];
  results: TestResult[];
  /** Anything the learner's code printed, in order. */
  logs: string[];
}

const PASS_LINES: readonly MessageKey[] = ['runner.pass1', 'runner.pass2', 'runner.pass3', 'runner.pass4'];
const FAIL_LINES: readonly MessageKey[] = ['runner.fail1', 'runner.fail2', 'runner.fail3', 'runner.fail4'];

function pick(lines: readonly MessageKey[], seed: string): Msg {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum = (sum + seed.charCodeAt(i)) % 9973;
  return msg(lines[sum % lines.length] ?? (lines[0] as MessageKey));
}

function clip(value: string): string {
  return value.replace(/\s+/g, ' ').slice(0, 120);
}

/**
 * Turn raw check results into the copy the learner actually reads. Every
 * failure names the check, what was expected, and what came back — no bare
 * "incorrect", ever.
 */
export function describe(results: readonly TestResult[], seed = '', logs: readonly string[] = []): GradeOutcome {
  const failures = results.filter((result) => !result.pass);
  const list = [...results];

  if (list.length === 0) {
    return { kind: 'pass', pass: true, headline: msg('runner.ranClean'), details: [], results: list, logs: [...logs] };
  }

  if (failures.length === 0) {
    return {
      kind: 'pass',
      pass: true,
      headline: pick(PASS_LINES, seed),
      details: list.map((result) => msg('runner.checkPassed', { name: result.name, got: clip(result.got) })),
      results: list,
      logs: [...logs],
    };
  }

  return {
    kind: 'fail',
    pass: false,
    headline: pick(FAIL_LINES, seed),
    details: failures.map((result) =>
      msg('runner.checkFailed', { name: result.name, expected: clip(result.expected), got: clip(result.got) }),
    ),
    results: list,
    logs: [...logs],
  };
}

export function unavailable(reason: Text): GradeOutcome {
  return {
    kind: 'unavailable',
    pass: false,
    headline: msg('runner.unavailable'),
    details: [reason, msg('runner.unavailableNote')],
    results: [],
    logs: [],
  };
}

export function compileFailure(problems: readonly { text: Text; line?: number }[]): GradeOutcome {
  return {
    kind: 'error',
    pass: false,
    headline: msg('runner.compileFailure'),
    details: problemLines(problems),
    results: [],
    logs: [],
  };
}

export function runtimeFailure(message: Text, logs: readonly string[] = []): GradeOutcome {
  return {
    kind: 'error',
    pass: false,
    headline: msg('runner.runtimeFailure'),
    details: [...runtimeLines(message), ...(explainMessage(message) ? [] : [msg('runner.runtimeHint')])],
    results: [],
    logs: [...logs],
  };
}

export function timeoutFailure(seconds: number, logs: readonly string[] = []): GradeOutcome {
  return {
    kind: 'timeout',
    pass: false,
    headline: msg('runner.timeout'),
    details: [
      msg('runner.timeoutAfter', { seconds: Math.round(seconds * 10) / 10 }),
      msg('runner.timeoutHint'),
      ...(logs.length > 0 ? [msg('runner.timeoutOutput')] : []),
    ],
    results: [],
    logs: [...logs],
  };
}

/** Adds notes about the run (output cut off, timers still waiting) to the details. */
export function withNotes(outcome: GradeOutcome, notes: readonly Text[]): GradeOutcome {
  if (notes.length === 0) return outcome;
  return { ...outcome, details: [...outcome.details, ...notes] };
}

/** One line for a type test that failed, in plain words where possible. */
function typeTestLine(result: TypeTestResult): Text {
  const detail = result.detail ?? '';
  if (detail === EXPECTED_ERROR) return msg('runner.typeTestExpectedError', { name: result.name });
  if (/does not satisfy the constraint '(true|false)'/.test(detail)) {
    return msg('runner.typeTestNotEqual', { name: result.name });
  }
  const friendly = explainMessage(detail);
  return msg('runner.typeTestFailed', { name: result.name, text: friendly ?? detail });
}

/**
 * The verdict on a type challenge: every type test, then anything wrong in
 * the learner's own code. A syntax error comes first, alone: until the code
 * parses, no test can be judged.
 */
export function describeTypeTests(
  results: readonly TypeTestResult[],
  problems: readonly TypeProblem[],
  seed = '',
): GradeOutcome {
  const asResults = results.map((result) => ({
    name: result.name,
    pass: result.pass,
    got: result.detail ?? '',
    expected: '',
  }));
  if (results.some((result) => result.detail === SYNTAX_FIRST)) {
    return {
      kind: 'error',
      pass: false,
      headline: msg('runner.compileFailure'),
      details: typeLines(problems),
      results: asResults,
      logs: [],
    };
  }
  const failures = results.filter((result) => !result.pass);
  const outcome: GradeOutcome =
    failures.length === 0
      ? {
          kind: 'pass',
          pass: true,
          headline: pick(PASS_LINES, seed),
          details: results.map((result) => msg('runner.typeTestPassed', { name: result.name })),
          results: asResults,
          logs: [],
        }
      : {
          kind: 'fail',
          pass: false,
          headline: pick(FAIL_LINES, seed),
          details: failures.map(typeTestLine),
          results: asResults,
          logs: [],
        };
  return withTypeProblems(outcome, problems);
}
