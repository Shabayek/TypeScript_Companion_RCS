import type { TypeTest } from '../content/schema';
import type { CheckOptions, TypeAnswer, TypeProblem, TypeSpan, TypeTestOutcome } from './typecheckCore';

/** What the page asks the type-check worker, and what each question returns. */
export type TypeCheckRequest =
  | { op: 'check'; code: string; options: CheckOptions }
  | { op: 'inspect'; code: string; options: CheckOptions }
  | { op: 'matchType'; code: string; target: string; answer: string; options: CheckOptions }
  | { op: 'typeTests'; code: string; tests: readonly TypeTest[]; options: CheckOptions };

export interface TypeCheckAnswers {
  check: TypeProblem[];
  inspect: TypeSpan[];
  matchType: TypeAnswer;
  typeTests: TypeTestOutcome;
}
