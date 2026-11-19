// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import { fullLesson as getLesson } from '../src/content/fullCourse';
import type { Lesson, PlayStep } from '../src/content/schema';
import { playProgram, sampleInput, usedSteps, type PlayInput } from '../src/content/play';
import { compileForSandbox } from '../src/runner/transform';
import { runSandboxInNode } from '../scripts/sandboxNode';

function game(lessonId: string): { lesson: Lesson; step: PlayStep } {
  const lesson = getLesson(lessonId);
  const step = lesson?.steps.find((item): item is PlayStep => item.kind === 'play');
  if (!lesson || !step) throw new Error(`no game in ${lessonId}`);
  return { lesson, step };
}

async function play(lessonId: string, input: PlayInput, replace: Record<string, string> = {}) {
  const { lesson, step } = game(lessonId);
  const sources = usedSteps(lesson, step).map((used) => replace[used.id] ?? used.solution);
  const js = await compileForSandbox(esbuild.transform, playProgram(sources, input, step.driver));
  return runSandboxInNode(js, []);
}

describe('Studio games run the project code', () => {
  beforeAll(() => esbuild.transform('const warm = 1;', { loader: 'ts' }), 60_000);

  it('every Studio lesson ends with a game before its recap', () => {
    for (const id of ['m07-l01-quiz-game', 'm07-l02-budget', 'm07-l03-story-generator']) {
      const { lesson, step } = game(id);
      expect(lesson.steps.indexOf(step)).toBe(lesson.steps.length - 2);
    }
  });

  it('quiz: the score comes from scoreAnswer and percent', async () => {
    const outcome = await play('m07-l01-quiz-game', { answers: [true, false, true, true] });
    expect(outcome.error).toBeUndefined();
    expect(outcome.logs).toEqual([
      'Question 1: right (score 10)',
      'Question 2: wrong (score 10)',
      'Question 3: right (score 20)',
      'Question 4: right (score 30)',
      'Final score: 30 points, 75%',
    ]);
  });

  it("quiz: a learner's bug shows up in the game", async () => {
    const buggy = 'function scoreAnswer(isCorrect: boolean, current: number): number {\n  return current + 10;\n}';
    const outcome = await play('m07-l01-quiz-game', { answers: [false, false] }, { score: buggy });
    expect(outcome.logs[1]).toBe('Question 2: wrong (score 20)');
  });

  it('budget: totals and what is left, including overspending', async () => {
    const fine = await play('m07-l02-budget', { budget: 20, expenses: [{ label: 'tea', amount: 2 }, { label: 'bus', amount: 3 }] });
    expect(fine.logs).toEqual(['Budget: 20', 'Spent: 5 on 2 thing(s)', 'Left to spend: 15']);
    const over = await play('m07-l02-budget', { budget: 5, expenses: [{ label: 'book', amount: 8 }] });
    expect(over.logs[2]).toBe('Over budget by 3!');
    const none = await play('m07-l02-budget', { budget: 20, expenses: [] });
    expect(none.logs[1]).toBe('Spent: 0 on 0 thing(s)');
  });

  it('story: any spin lands on real words', async () => {
    const outcome = await play('m07-l03-story-generator', { spins: [0, 4, 998] });
    expect(outcome.logs).toEqual(['Once, Ada went to Lagos to solve the singing fridge.']);
    const big = await play('m07-l03-story-generator', { spins: [999, 999, 999] });
    expect(big.logs[0]).toMatch(/^Once, .+ went to .+ to solve the .+\.$/);
    expect(big.logs[0]).not.toContain('undefined');
  });

  it('sample inputs fit each game', () => {
    expect(sampleInput(game('m07-l01-quiz-game').step.game)).toEqual({ answers: [true, false, true, false] });
    expect(sampleInput(game('m07-l03-story-generator').step.game)).toEqual({ spins: [7, 12, 17] });
  });
});
