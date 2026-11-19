import type { CompilerFlags, Engine, TestCase } from '../content/schema';
import type { TypeProblem } from './typecheckCore';
import type { Text } from '../i18n/text';

export interface CompileProblem {
  /** The compiler's words (a string), or one of the app's messages. */
  text: Text;
  line?: number;
  column?: number;
}

export type RunStatus = 'ok' | 'compile-error' | 'runtime-error' | 'timeout' | 'unavailable';

export interface TestResult {
  name: string;
  pass: boolean;
  got: string;
  expected: string;
}

export interface RunResult {
  status: RunStatus;
  logs: string[];
  tests: TestResult[];
  /** The runtime error: the engine's words, or one of the app's messages. */
  error?: Text;
  problems?: CompileProblem[];
  /** Things to know about the run: output cut off, timers still waiting. */
  notes?: Text[];
  /** What TypeScript's type checker found (empty when the types are right). */
  typeProblems?: TypeProblem[];
  /** Set when the type checker could not run, with the reason. */
  typeCheckSkipped?: Text;
}

export interface RunOptions {
  tests?: readonly TestCase[];
  timeoutMs?: number;
  /** Check types with TypeScript (default: yes). */
  typeCheck?: boolean;
  /** The device engine to run and check for (default: modern, nothing removed). */
  engine?: Engine;
  /** Compiler flags for the type check. */
  flags?: CompilerFlags;
}

export interface CompileResponse {
  ok: boolean;
  code?: string;
  problems?: CompileProblem[];
  /** True when the compiler itself could not run, not a problem with the code. */
  fatal?: boolean;
}

export const DEFAULT_TIMEOUT_MS = 2000;
export const MAX_TIMEOUT_MS = 5000;
