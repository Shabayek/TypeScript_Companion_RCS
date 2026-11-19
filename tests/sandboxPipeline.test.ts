// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import type { CodeStep } from '../src/content/schema';
import { compileForSandbox } from '../src/runner/transform';
import { runSandboxInNode } from '../scripts/sandboxNode';
import { typeCheckInNode } from '../scripts/typecheckNode';

const codeSteps = ALL_LESSONS.flatMap((lesson) =>
  lesson.steps
    .filter((step): step is CodeStep => step.kind === 'fix' || step.kind === 'write')
    .map((step) => ({ where: `${lesson.id}/${step.id}`, step })),
);

async function grade(code: string, step: CodeStep) {
  const js = await compileForSandbox(esbuild.transform, code);
  return runSandboxInNode(js, step.tests);
}

describe('graded exercises through the real sandbox pipeline', () => {
  // esbuild-wasm's first transform loads the wasm, which can take seconds
  // when other test files are running; do it once, outside any test budget.
  beforeAll(() => esbuild.transform('const warm = 1;', { loader: 'ts' }), 60_000);

  it('covers every graded code step', () => {
    // 29 originally, plus the type-fixing steps added with the type checker.
    expect(codeSteps.length).toBeGreaterThanOrEqual(31);
  });

  it.each(codeSteps)('$where: the reference solution passes every check', async ({ step }) => {
    const outcome = await grade(step.solution, step);
    expect(outcome.error ?? outcome.loadError ?? null).toBeNull();
    expect(outcome.results.filter((result) => !result.pass)).toEqual([]);
    expect(outcome.results).toHaveLength(step.tests.length);
    // Solved means type-correct too.
    expect(typeCheckInNode(step.solution)).toEqual([]);
  }, 20_000);
});
