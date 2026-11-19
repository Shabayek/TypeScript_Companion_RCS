import type { CompilerFlags, Engine } from '../content/schema';
import type { Text } from '../i18n/text';
import { matchType } from './typecheckClient';

/*
 * Kept apart from the runner's index so the predict-the-type exercise does
 * not pull the compiler and sandbox into its bundle: it needs only the checker.
 */

export type TypeAnswerVerdict =
  | { kind: 'right'; actual: string | null }
  | { kind: 'wrong'; actual: string | null; problem?: string }
  | { kind: 'unavailable'; reason: Text };

/**
 * Predict-the-type: the answer is right when it is exactly the type of
 * `target`. A listed spelling is accepted straight away (also offline).
 */
export async function gradeTypeAnswer(
  code: string,
  target: string,
  answer: string,
  accepted: readonly string[],
  options: { engine?: Engine; flags?: CompilerFlags } = {},
): Promise<TypeAnswerVerdict> {
  const normalise = (value: string) => value.replace(/\s+/g, '').replace(/;$/, '').replace(/'/g, '"');
  const given = normalise(answer);
  const listed = accepted.some((item) => normalise(item) === given);
  const checked = await matchType(code, target, answer, {
    engine: options.engine ?? 'modern',
    ...(options.flags ? { flags: options.flags } : {}),
  });
  if (!checked.ok) return listed ? { kind: 'right', actual: null } : { kind: 'unavailable', reason: checked.reason };
  if (listed || checked.value.correct) return { kind: 'right', actual: checked.value.actual };
  return {
    kind: 'wrong',
    actual: checked.value.actual,
    ...(checked.value.answerProblem ? { problem: checked.value.answerProblem } : {}),
  };
}
