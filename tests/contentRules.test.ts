// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkLesson } from '../scripts/validateContent';
import { L, LL } from '../src/content/authoring';
import type { Lesson, Step } from '../src/content/schema';

/*
 * The content rules for Phase 4's step fields, on small made-up lessons:
 * bonus steps, modern steps with Classic alternatives, compiler flags, type
 * challenges and predict-the-type. The real course is checked in content.test.ts.
 */

const text = L('Base text.', 'Story text.', 'Pro text.');

const read: Step = { id: 'read', kind: 'read', prompt: text, body: text };
const check: Step = {
  id: 'check',
  kind: 'check',
  prompt: text,
  hint: text,
  explain: text,
  choices: [
    { id: 'a', text: L('A'), correct: true },
    { id: 'b', text: L('B'), correct: false },
  ],
};
const recap: Step = { id: 'recap', kind: 'recap', prompt: text, points: LL(['One.'], ['One.'], ['One.']) };

function lesson(steps: Step[]): Lesson {
  return {
    id: 'm05-test',
    moduleId: 'm05',
    order: 99,
    title: { story: 'Test', explorer: 'Test', pro: 'Test' },
    estMinutes: 5,
    concepts: ['union'],
    steps,
    recap: LL(['One.'], ['One.'], ['One.']),
  };
}

const messages = async (steps: Step[]) => (await checkLesson(lesson(steps))).map((issue) => `${issue.where}: ${issue.message}`);

const predictLast: Step = {
  id: 'last',
  kind: 'predict',
  prompt: text,
  hint: text,
  explain: text,
  code: 'console.log(["a", "b"].at(-1));',
  answer: 'b',
};

const classicPredict = {
  kind: 'predict' as const,
  prompt: text,
  hint: text,
  explain: text,
  code: 'const list = ["a", "b"];\nconsole.log(list[list.length - 1]);',
  answer: 'b',
};

describe('lesson shape', () => {
  it('a well-formed lesson has no issues', async () => {
    expect(await messages([read, check, { ...check, id: 'check2' }, recap])).toEqual([]);
  });

  it('counts only required steps, and keeps bonus steps after them', async () => {
    const bonus = { ...check, id: 'extra', bonus: true as const };
    expect(await messages([read, check, { ...check, id: 'c2' }, recap, bonus])).toEqual([]);
    expect(await messages([read, check, recap, bonus])).toContain('m05-test: has 3 required steps; the player is designed for 4–7');
    expect(await messages([read, bonus, check, { ...check, id: 'c2' }, recap])).toContain(
      'm05-test: bonus steps must come after every required step',
    );
  });
});

describe('modern steps', () => {
  it('must come with a Classic alternative', async () => {
    expect(await messages([read, check, { ...predictLast, runtime: 'modern' }, recap])).toContain(
      'm05-test/last: a runtime: "modern" step needs a classic alternative',
    );
  });

  it('are graded on the Modern engine, their alternative on Classic', async () => {
    expect(await messages([read, check, { ...predictLast, runtime: 'modern', classic: classicPredict }, recap])).toEqual([]);
  });

  it('must really need a modern engine', async () => {
    const portable = { ...classicPredict, id: 'last', runtime: 'modern' as const, classic: classicPredict };
    expect(await messages([read, check, portable, recap])).toContain(
      'm05-test/last: is marked runtime: "modern", but its code also works on Classic',
    );
  });

  it('a Classic alternative that uses modern features fails on the Classic engine', async () => {
    const broken = { ...predictLast, runtime: 'modern' as const, classic: { ...classicPredict, code: predictLast.kind === 'predict' ? predictLast.code : '' } };
    const found = await messages([read, check, broken, recap]);
    expect(found.some((line) => line.startsWith('m05-test/last.classic.code: type error') && line.includes("'at'"))).toBe(true);
    expect(found.some((line) => line.startsWith('m05-test/last.classic: code does not run cleanly'))).toBe(true);
  });

  it('an alternative is graded exactly when the step it replaces is', async () => {
    const ungraded = { ...predictLast, runtime: 'modern' as const, classic: { kind: 'read' as const, prompt: text, body: text } };
    expect(await messages([read, check, ungraded, recap])).toContain('m05-test/last.classic: must be graded exactly when the step it replaces is');
  });

  it('a step that runs no code cannot be modern, and a non-modern step has no alternative', async () => {
    expect(await messages([{ ...read, runtime: 'modern', classic: { kind: 'read', prompt: text, body: text } }, check, check, recap])).toContain(
      'm05-test/read: a read step runs no code, so it cannot need a modern engine',
    );
    expect(await messages([read, check, { ...predictLast, code: classicPredict.code, classic: classicPredict }, recap])).toContain(
      'm05-test/last: has a classic alternative but is not marked runtime: "modern"',
    );
  });
});

describe('compiler flags', () => {
  const initial: Step = {
    id: 'fix',
    kind: 'fix',
    prompt: text,
    hint: text,
    explain: text,
    compilerFlags: { noUncheckedIndexedAccess: true },
    starter: 'function initial(names: string[]): string {\n  const first = names[0];\n  return first.charAt(0);\n}',
    solution: 'function initial(names: string[]): string {\n  const first = names[0];\n  if (first === undefined) return "?";\n  return first.charAt(0);\n}',
    tests: [{ name: 'empty', call: 'initial([])', expect: '?' }],
  };

  it('type-check the step with the flag on', async () => {
    expect(await messages([read, check, initial, recap])).toEqual([]);
    const unguarded = { ...initial, solution: 'function initial(names: string[]): string {\n  return (names[0] ?? "?").charAt(0);\n}\nconst n: string = [""][0];' };
    expect((await messages([read, check, unguarded, recap])).some((line) => line.includes("Type 'string | undefined' is not assignable"))).toBe(true);
  });

  it('must be known flags', async () => {
    const odd = { ...initial, compilerFlags: { noLib: true } as never };
    expect(await messages([read, check, odd, recap])).toContain('m05-test/fix: unknown compiler flag “noLib”');
  });
});

describe('type challenges', () => {
  const box: Step = {
    id: 'box',
    kind: 'types',
    prompt: text,
    hint: text,
    explain: text,
    starter: 'type Box<T> = { value: unknown };',
    solution: 'type Box<T> = { value: T };',
    typeTests: [
      { name: 'holds its type', code: 'type T1 = Expect<Equal<Box<number>["value"], number>>;' },
      { name: 'refuses text', code: 'const wrong: Box<number> = { value: "3" };', expect: 'error' },
    ],
  };

  it('the solution passes every type test and the starter does not', async () => {
    expect(await messages([read, check, box, recap])).toEqual([]);
  });

  it('reports a solution that fails, and a starter that already passes', async () => {
    const found = await messages([read, check, { ...box, solution: box.kind === 'types' ? box.starter : '' }, recap]);
    expect(found).toContain("m05-test/box solution: fails type test “holds its type”: Type 'false' does not satisfy the constraint 'true'.");
    const easy = await messages([read, check, { ...box, starter: box.kind === 'types' ? box.solution : '' }, recap]);
    expect(easy).toContain('m05-test/box starter: already passes every type test');
  });

  it('an expected error is expected on the last line; lines before it must compile', async () => {
    const setup = {
      ...box,
      typeTests: [
        ...(box.kind === 'types' ? box.typeTests : []),
        { name: 'with setup', code: 'declare const value: Box<number>;\nconst text: string = value.value;', expect: 'error' as const },
      ],
    };
    expect(await messages([read, check, setup, recap])).toEqual([]);
    const broken = { ...box, typeTests: [{ name: 'broken setup', code: 'const bad: number = "x";\nconst text: string = 1;', expect: 'error' as const }] };
    expect((await messages([read, check, broken, recap])).some((line) => line.includes('fails type test “broken setup”'))).toBe(true);
  });
});

describe('predict the type', () => {
  const narrowed: Step = {
    id: 'narrowed',
    kind: 'predictType',
    prompt: text,
    hint: text,
    explain: text,
    code: 'function f(value: string | number | boolean) {\n  if (typeof value === "boolean") return;\n  const rest = value;\n  return rest;\n}',
    target: 'rest',
    answer: 'string | number',
    alsoAccept: ['number | string'],
  };

  it('the answer, and every accepted spelling, must be exactly the type', async () => {
    expect(await messages([read, check, narrowed, recap])).toEqual([]);
    const wrong = { ...narrowed, alsoAccept: ['string'] };
    expect(await messages([read, check, wrong, recap])).toContain(
      'm05-test/narrowed: “string” is not the type of rest (TypeScript: string | number)',
    );
  });

  it('the target must be declared in the code', async () => {
    expect(await messages([read, check, { ...narrowed, target: 'missing' }, recap])).toContain(
      'm05-test/narrowed: “missing” is not declared in the code',
    );
  });
});
