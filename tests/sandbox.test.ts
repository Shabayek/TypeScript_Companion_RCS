// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import type { TestCase } from '../src/content/schema';
import { OUTPUT_LIMITS } from '../src/runner/sandbox';
import { AWAIT_WITH_EXPORT, compileForSandbox } from '../src/runner/transform';
import { inEnglish } from '../src/i18n/messages';
import { msg } from '../src/i18n/text';
import { runSandboxInNode } from '../scripts/sandboxNode';

async function run(code: string, tests: readonly TestCase[] = [], timeoutMs = 2000) {
  return runSandboxInNode(await compileForSandbox(esbuild.transform, code), tests, timeoutMs);
}

const check = (call: string, expect: string): TestCase => ({ name: call, call, expect });

beforeAll(() => esbuild.transform('const warm = 1;', { loader: 'ts' }), 60_000);

describe('checks see what the learner declared', () => {
  it('finds functions, arrows, consts, lets and classes', async () => {
    const outcome = await run(
      [
        'function add(a: number, b: number) { return a + b; }',
        'const square = (n: number) => n * n;',
        'const greeting = "hi";',
        'let count = 2; count += 1;',
        'class Counter { value = 0; increment() { return ++this.value; } }',
      ].join('\n'),
      [
        check('add(2, 3)', '5'),
        check('square(4)', '16'),
        check('greeting', 'hi'),
        check('count', '3'),
        check('new Counter().increment()', '1'),
      ],
    );
    expect(outcome.error).toBeUndefined();
    expect(outcome.results.map((result) => result.pass)).toEqual([true, true, true, true, true]);
  });

  it('still fails a wrong answer, and says what came back', async () => {
    const outcome = await run('function add(a: number, b: number) { return a - b; }', [check('add(2, 3)', '5')]);
    expect(outcome.results[0]).toMatchObject({ pass: false, got: '-1', expected: '5' });
  });

  it('fails a check whose name was never declared', async () => {
    const outcome = await run('const other = 1;', [check('greet("Ada")', 'Hello, Ada')]);
    expect(outcome.results[0]).toMatchObject({ pass: false, got: 'threw greet is not defined' });
  });

  it('skips the checks when the program itself throws', async () => {
    const outcome = await run('const x: any = undefined;\nx.length;', [check('1', '1')]);
    expect(outcome.error).toMatch(/^TypeError/);
    expect(outcome.results).toEqual([]);
  });

  it('awaits a check that returns a promise', async () => {
    const outcome = await run('async function load() { return 42; }', [check('load()', '42')]);
    expect(outcome.results[0]?.pass).toBe(true);
  });

  it('lets the learner name things console, module or exports', async () => {
    const outcome = await run('const module = "Maths";\nconst exports = 3;\nconsole.log(module, exports);');
    expect(outcome.error).toBeUndefined();
    expect(outcome.logs).toEqual(['Maths 3']);
  });

  it('keeps the runner out of reach: posting a fake result, or replacing the comparison, does not work', async () => {
    const fake = '{ type: "done", results: [{ name: "answer", pass: true, got: "42", expected: "42" }], error: null, notes: [] }';
    const wrongAnswer = 'const answer = 1;';

    // 1. The global postMessage is hidden.
    const direct = await run(`postMessage(${fake});\n${wrongAnswer}`, [check('answer', '42')]);
    expect(direct.error).toMatch(/TypeError/);
    expect(direct.results).toEqual([]);

    // 2. The runner's own post function, comparison and boot hook are not in
    //    scope (they were, when the learner's code was nested inside the runner).
    for (const attempt of [`__tscPost(${fake});`, 'self.__tscBoot(() => async () => ({ __tscChecks: [() => 42] }));']) {
      const outcome = await run(`${wrongAnswer}\n${attempt}`, [check('answer', '42')]);
      expect(outcome.error, attempt).toMatch(/ReferenceError|TypeError/);
      expect(outcome.results.some((result) => result.pass), attempt).toBe(false);
    }

    // 3. Replacing the comparison has no effect. (Node's vm has a quirk: a
    //    strict-mode assignment of a *function* to an undeclared name creates
    //    a global instead of throwing, so only the grading is asserted here;
    //    playwright/runner.spec.ts checks the ReferenceError in a real worker.)
    const override = await run(`${wrongAnswer}\n__tscSame = () => true;`, [check('answer', '42')]);
    expect(override.results).toEqual([{ name: 'answer', pass: false, got: '1', expected: '42' }]);
  });

  it('does not let a program that returns early pretend its checks ran', async () => {
    const outcome = await run('const answer = 42;\nreturn [() => 42];', [check('answer', '42')]);
    expect(inEnglish(outcome.error ?? '')).toMatch(/did not reach its last line/);
    expect(outcome.results).toEqual([]);
  });
});

describe('output limits', () => {
  it(`keeps at most ${OUTPUT_LIMITS.maxLines} lines and says it cut the rest`, async () => {
    const outcome = await run('for (let i = 0; i < 5000; i++) console.log("line " + i);');
    expect(outcome.logs).toHaveLength(OUTPUT_LIMITS.maxLines);
    expect(outcome.logs.at(-1)).toBe(`line ${OUTPUT_LIMITS.maxLines - 1}`);
    expect(outcome.notes.map(inEnglish).join(' ')).toMatch(/cut off after 1,000 lines/);
  });

  it('shortens a single enormous line', async () => {
    const outcome = await run('console.log("x".repeat(50000));');
    expect(outcome.logs[0]?.length).toBeLessThan(OUTPUT_LIMITS.maxLineChars + 30);
    expect(outcome.logs[0]).toMatch(/line shortened\)$/);
  });

  it('caps the total size of the output', async () => {
    const outcome = await run('for (let i = 0; i < 200; i++) console.log("y".repeat(1500));');
    const total = outcome.logs.reduce((sum, line) => sum + line.length, 0);
    expect(total).toBeLessThanOrEqual(OUTPUT_LIMITS.maxChars);
    expect(outcome.notes.length).toBe(1);
  });

  it('keeps what a never-ending loop printed before it was stopped', async () => {
    const outcome = await run('let i = 0;\nwhile (true) { console.log("count", i); }', [], 500);
    expect(outcome.timedOut).toBe(true);
    expect(outcome.logs[0]).toBe('count 0');
    expect(outcome.logs.length).toBe(OUTPUT_LIMITS.maxLines);
  });
});

describe('asynchronous programs', () => {
  it('shows output from promises and timers, in the order JavaScript runs them', async () => {
    const outcome = await run(
      [
        'setTimeout(() => console.log("four"), 20);',
        'console.log("one");',
        'Promise.resolve("three").then((value) => console.log(value));',
        'console.log("two");',
      ].join('\n'),
    );
    expect(outcome.logs).toEqual(['one', 'two', 'three', 'four']);
    expect(outcome.notes).toEqual([]);
  });

  it('runs top-level await', async () => {
    const outcome = await run('const value = await Promise.resolve(5);\nconsole.log("got", value);');
    expect(outcome.error).toBeUndefined();
    expect(outcome.logs).toEqual(['got 5']);
  });

  it('reports an error thrown later, in a timer', async () => {
    const outcome = await run('setTimeout(() => { throw new Error("late"); }, 5);', [check('1', '1')]);
    expect(outcome.error).toBe('Error: late');
  });

  it('stops waiting for a timer that is too far away, and says so', async () => {
    const outcome = await run('setTimeout(() => console.log("much later"), 60000);\nconsole.log("now");', [], 600);
    expect(outcome.timedOut).toBe(false);
    expect(outcome.logs).toEqual(['now']);
    expect(outcome.notes.map(inEnglish).join(' ')).toMatch(/timers were still waiting/);
  });

  it('finishes once a cleared interval is gone', async () => {
    const outcome = await run(
      'let n = 0;\nconst id = setInterval(() => { n++; console.log("tick", n); if (n === 3) clearInterval(id); }, 5);',
    );
    expect(outcome.logs).toEqual(['tick 1', 'tick 2', 'tick 3']);
    expect(outcome.notes).toEqual([]);
  });
});

describe('modules in a single-file playground', () => {
  it('runs code that uses export, and checks can use the exported names', async () => {
    const outcome = await run('export function add(a: number, b: number) { return a + b; }\nexport const x = 1;', [
      check('add(x, 2)', '3'),
    ]);
    expect(outcome.error).toBeUndefined();
    expect(outcome.results[0]?.pass).toBe(true);
  });

  it('explains that import is not available', async () => {
    const outcome = await run('import { readFile } from "fs";\nreadFile("a");');
    expect(outcome.error).toMatch(/"fs" cannot be imported here/);
  });

  it('gives a clear compile error for top-level await mixed with export', async () => {
    await expect(
      compileForSandbox(esbuild.transform, 'export const v = await Promise.resolve(1);'),
    ).rejects.toMatchObject({ errors: [{ text: AWAIT_WITH_EXPORT }] });
    expect(inEnglish(msg('runner.awaitWithExport'))).toMatch(/cannot be mixed/);
  });

  it('still reports real syntax errors with a line number', async () => {
    await expect(compileForSandbox(esbuild.transform, 'const a = 1;\nconst b = ;')).rejects.toMatchObject({
      errors: [{ location: { line: 2 } }],
    });
  });
});
