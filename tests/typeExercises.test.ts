// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { describe, expect, it } from 'vitest';
import { nodeTypeChecker, typeCheckInNode } from '../scripts/typecheckNode';
import { runSandboxInNode } from '../scripts/sandboxNode';
import { compileForSandbox } from '../src/runner/transform';
import { describeTypeTests, typeLines, runtimeLines } from '../src/runner/grade';
import { EXPECTED_ERROR, SYNTAX_FIRST } from '../src/runner/typecheckCore';
import { inEnglish } from '../src/i18n/messages';
import { bonusSteps, requiredSteps, stepForEngine, type Step } from '../src/content/schema';
import { L } from '../src/content/authoring';

const checker = nodeTypeChecker();
const codes = (code: string, options = {}) => typeCheckInNode(code, options).map((problem) => problem.code);

describe('the checker follows the device engine', () => {
  const lastItem = 'const queue = ["Ada", "Cy"];\nconsole.log(queue.at(-1));';

  it('Classic checks against ES2021: .at() is unknown there (TS2550)', () => {
    expect(codes(lastItem)).toEqual([2550]);
    expect(codes(lastItem, { engine: 'classic' })).toEqual([2550]);
  });

  it('Modern checks against ES2023: .at(), toSorted, findLast, Object.hasOwn and structuredClone', () => {
    expect(codes(lastItem, { engine: 'modern' })).toEqual([]);
    expect(
      codes(
        'const a = [3, 1].toSorted();\nconst b = a.findLast((n) => n > 1);\nconst c = Object.hasOwn({ x: 1 }, "x");\nconst d = structuredClone({ a, b, c });\nconsole.log(d);',
        { engine: 'modern' },
      ),
    ).toEqual([]);
    expect(codes('const d = structuredClone({ a: 1 });', { engine: 'classic' })).toEqual([2304]);
  });

  it('ES2021 itself works on both: replaceAll, Promise.any, ??=', () => {
    const code = 'let name: string | undefined;\nname ??= "a-b".replaceAll("-", " ");\nvoid Promise.any([Promise.resolve(1)]);';
    expect(codes(code, { engine: 'classic' })).toEqual([]);
    expect(codes(code, { engine: 'modern' })).toEqual([]);
  });

  it('never mixes up programs checked for different engines or flags', () => {
    // Each option set has its own language service; they share parsed files,
    // which once handed one service the other's program.
    for (let round = 0; round < 3; round += 1) {
      expect(codes('const a: number = 1;', { engine: 'modern' })).toEqual([]);
      expect(codes('const b: string = 1;', { engine: 'classic' })).toEqual([2322]);
      expect(codes('const c = [1].at(0);', { engine: 'modern', flags: { noImplicitReturns: true } })).toEqual([]);
      expect(codes('const d = [1].at(0);', { engine: 'classic' })).toEqual([2550]);
    }
  });

  it('explains a Classic gap in plain words, with the classic way to do it', () => {
    const [problem] = typeCheckInNode(lastItem, { engine: 'classic' });
    const [friendly, exact] = typeLines(problem ? [problem] : []).map(inEnglish);
    expect(friendly).toBe(
      '"at" is newer JavaScript than this device mode runs. Older phones (Classic mode) don’t have it. The classic way: items[items.length - 1]. (line 2)',
    );
    expect(exact).toMatch(/^TypeScript said: Property 'at' does not exist/);
  });
});

describe('per-step compiler flags', () => {
  const code = 'const names: string[] = [];\nconst first: string = names[0];';

  it('noUncheckedIndexedAccess makes an index read string | undefined', () => {
    expect(codes(code)).toEqual([]);
    expect(codes(code, { flags: { noUncheckedIndexedAccess: true } })).toEqual([2322]);
  });

  it('a flag can be switched off to show what it normally catches', () => {
    const untyped = 'function double(n) { return n * 2; }';
    expect(codes(untyped)).toEqual([7006]);
    expect(codes(untyped, { flags: { noImplicitAny: false } })).toEqual([]);
  });

  it('only known flags are passed to TypeScript', () => {
    const sneaky = { flags: { noUncheckedIndexedAccess: true, noLib: true } as never };
    expect(codes(code, sneaky)).toEqual([2322]);
  });
});

describe('predict the type', () => {
  const code = [
    'function describe(value: string | number | boolean): string {',
    '  if (typeof value === "boolean") return value ? "yes" : "no";',
    '  const rest = value;',
    '  return String(rest);',
    '}',
    'const total = 3;',
    'let count = 3;',
    'type Size = "s" | "m";',
    'interface Point { x: number; y: number }',
  ].join('\n');

  it('writes the type of a value or a type the way TypeScript does', () => {
    expect(checker.typeOf(code, 'rest')).toEqual({ kind: 'value', text: 'string | number' });
    expect(checker.typeOf(code, 'total')).toEqual({ kind: 'value', text: '3' });
    expect(checker.typeOf(code, 'count')).toEqual({ kind: 'value', text: 'number' });
    expect(checker.typeOf(code, 'Size')).toEqual({ kind: 'type', text: '"s" | "m"' });
    expect(checker.typeOf(code, 'nothing')).toBeNull();
  });

  it('accepts any spelling of the same type, and nothing wider or narrower', () => {
    expect(checker.matchType(code, 'rest', 'number | string').correct).toBe(true);
    expect(checker.matchType(code, 'rest', 'string|number').correct).toBe(true);
    expect(checker.matchType(code, 'rest', 'string').correct).toBe(false);
    expect(checker.matchType(code, 'rest', 'string | number | boolean').correct).toBe(false);
    expect(checker.matchType(code, 'rest', 'any').correct).toBe(false);
    expect(checker.matchType(code, 'total', '3').correct).toBe(true);
    expect(checker.matchType(code, 'total', 'number').correct).toBe(false);
    expect(checker.matchType(code, 'Size', "'m' | 's'").correct).toBe(true);
    expect(checker.matchType(code, 'Point', '{ y: number; x: number }').correct).toBe(true);
  });

  it('says when an answer is not a type at all', () => {
    const verdict = checker.matchType(code, 'rest', 'strin | number');
    expect(verdict).toMatchObject({ correct: false, actual: 'string | number' });
    expect(verdict.answerProblem).toMatch(/Cannot find name 'strin'/);
  });
});

describe('type challenges', () => {
  const solution = 'type Box<T> = { value: T };';
  const tests = [
    { name: 'holds its type', code: 'type T1 = Expect<Equal<Box<number>["value"], number>>;' },
    { name: 'refuses text', code: 'const wrong: Box<number> = { value: "3" };', expect: 'error' as const },
  ];

  it('passes when every type test compiles (and every expected error is an error)', () => {
    expect(checker.typeTests(solution, tests)).toEqual({
      problems: [],
      results: [
        { name: 'holds its type', pass: true },
        { name: 'refuses text', pass: true },
      ],
    });
  });

  it('fails a test whose types differ, and one whose expected error never comes', () => {
    const outcome = checker.typeTests('type Box<T> = { value: unknown };', tests);
    expect(outcome.results).toEqual([
      { name: 'holds its type', pass: false, detail: "Type 'false' does not satisfy the constraint 'true'." },
      { name: 'refuses text', pass: false, detail: EXPECTED_ERROR },
    ]);
    const graded = describeTypeTests(outcome.results, outcome.problems);
    expect(graded).toMatchObject({ kind: 'fail', pass: false });
    expect(graded.details.map(inEnglish)).toEqual([
      '“holds its type”: the type is not the one this check expects yet.',
      '“refuses text”: TypeScript should reject this line, but it accepts it.',
    ]);
  });

  it('judges nothing until the code parses', () => {
    const outcome = checker.typeTests('type Box<T> = { value: T ;', tests);
    expect(outcome.results.every((result) => result.detail === SYNTAX_FIRST)).toBe(true);
    expect(outcome.problems.length).toBeGreaterThan(0);
    expect(describeTypeTests(outcome.results, outcome.problems)).toMatchObject({ kind: 'error', pass: false });
  });

  it('a type error in the learner’s own code is "not yet", even when the tests pass', () => {
    const outcome = checker.typeTests(`${solution}\nconst oops: number = "1";`, tests);
    expect(outcome.results.every((result) => result.pass)).toBe(true);
    const graded = describeTypeTests(outcome.results, outcome.problems);
    expect(graded).toMatchObject({ kind: 'fail', pass: false });
    expect(inEnglish(graded.headline)).toBe('The checks pass, but TypeScript found a type problem.');
  });
});

describe('tap to see a type', () => {
  it('gives every name in the code with TypeScript’s description', () => {
    const code = 'const total = [1, 2].map((n) => n * 2);';
    const spans = checker.inspect(code);
    expect(spans.map((span) => code.slice(span.start, span.end))).toEqual(['total', 'map', 'n', 'n']);
    expect(spans[0]?.display).toBe('const total: number[]');
    expect(spans[2]?.display).toBe('(parameter) n: number');
  });
});

describe('the Classic runtime', () => {
  const run = async (code: string, engine: 'modern' | 'classic') =>
    runSandboxInNode(await compileForSandbox(esbuild.transform, code), [], 2000, engine);

  it('removes ES2022+ built-ins, as an older phone lacks them', async () => {
    const modern = await run('console.log([1, 2, 3].at(-1));', 'modern');
    expect(modern.logs).toEqual(['3']);
    const classic = await run('console.log([1, 2, 3].at(-1));', 'classic');
    expect(classic.error).toMatch(/TypeError: .*at is not a function/);
    expect(inEnglish(runtimeLines(classic.error ?? '')[0]!)).toMatch(/^"at" is newer JavaScript/);
  });

  it('keeps everything up to ES2021', async () => {
    const classic = await run('console.log("a-b".replaceAll("-", "+"), [1, [2]].flat().length);', 'classic');
    expect(classic.logs).toEqual(['a+b 2']);
  });

  it('removes structuredClone and Object.hasOwn too', async () => {
    expect((await run('console.log(typeof structuredClone, typeof Object.hasOwn);', 'classic')).logs).toEqual([
      'undefined undefined',
    ]);
    expect((await run('console.log(typeof structuredClone, typeof Object.hasOwn);', 'modern')).logs).toEqual([
      'function function',
    ]);
  });
});

describe('bonus steps and classic alternatives', () => {
  const modern: Step = {
    id: 'last',
    kind: 'predict',
    runtime: 'modern',
    prompt: L('What prints?'),
    code: 'console.log([1].at(-1));',
    answer: '1',
    classic: { kind: 'predict', prompt: L('Classic: what prints?'), code: 'console.log([1][0]);', answer: '1' },
  };

  it('shows the classic alternative only on Classic, under the same id', () => {
    expect(stepForEngine(modern, 'modern')).toBe(modern);
    const classic = stepForEngine(modern, 'classic');
    expect(classic).toMatchObject({ id: 'last', kind: 'predict', code: 'console.log([1][0]);' });
    expect('runtime' in classic).toBe(false);
  });

  it('keeps bonus steps out of the required ones', () => {
    const steps = [{ id: 'a' }, { id: 'b' }, { id: 'c', bonus: true as const }];
    expect(requiredSteps(steps).map((step) => step.id)).toEqual(['a', 'b']);
    expect(bonusSteps(steps).map((step) => step.id)).toEqual(['c']);
  });
});
