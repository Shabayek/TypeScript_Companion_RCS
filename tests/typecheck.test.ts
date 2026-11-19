// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { describe as describeOutcome, typeLines, withTypeProblems } from '../src/runner/grade';
import { typeCheckInNode } from '../scripts/typecheckNode';
import { inEnglish } from '../src/i18n/messages';

const codes = (code: string) => typeCheckInNode(code).map((problem) => problem.code);

describe('the type checker the app uses', () => {
  it('reports a type mistake that running the code would never show', () => {
    expect(typeCheckInNode('const age: number = "36";\nconsole.log(age);')).toEqual([
      { text: "Type 'string' is not assignable to type 'number'.", line: 1, column: 7, code: 2322 },
    ]);
  });

  it('accepts correct code, including what the sandbox provides', () => {
    expect(codes('console.log("hi");\nsetTimeout(() => console.log("later"), 10);\nconst list = [1, 2, 3].map((n) => n * 2);')).toEqual([]);
  });

  it('treats each program as its own module: common names do not clash, top-level await works', () => {
    expect(codes('const name = "Ada";\nconst total = 1;\nconst value = await Promise.resolve(name);\nconsole.log(value, total);')).toEqual([]);
  });

  it('is strict, like the lessons', () => {
    expect(codes('function double(n) { return n * 2; }')).toContain(7006); // implicit any
    expect(codes('const user: { name?: string } = {};\nuser.name.length;')).toContain(18048); // possibly undefined
  });

  it('knows there is no DOM and no Node in the sandbox', () => {
    expect(codes('document.title = "x";')).toContain(2584);
    expect(codes('const fs = require("fs");')).toContain(2591);
  });
});

describe('grading with types', () => {
  const problems = [{ text: "Type 'string' is not assignable to type 'number'.", line: 1 }];

  it('passing checks with a type problem is "not yet"', () => {
    const outcome = withTypeProblems(describeOutcome([{ name: 'age', pass: true, got: '36', expected: '36' }]), problems);
    expect(outcome).toMatchObject({ kind: 'fail', pass: false });
    expect(inEnglish(outcome.headline)).toBe('The checks pass, but TypeScript found a type problem.');
    expect(inEnglish(outcome.details[0]!)).toBe('A value of type string is used where number is expected. (line 1)');
    expect(inEnglish(outcome.details[1]!)).toBe("TypeScript said: Type 'string' is not assignable to type 'number'.");
  });

  it('leaves a type-correct outcome alone', () => {
    const outcome = describeOutcome([{ name: 'age', pass: true, got: '36', expected: '36' }]);
    expect(withTypeProblems(outcome, [])).toBe(outcome);
  });

  it('explains "no DOM, no Node" in this app’s terms, not with project-setup advice', () => {
    const [doc] = typeCheckInNode('document.title = "x";');
    expect(inEnglish(typeLines(doc ? [doc] : [])[0]!)).toMatch(/There is no web page here/);
    const [req] = typeCheckInNode('const fs = require("fs");');
    expect(inEnglish(typeLines(req ? [req] : [])[0]!)).toMatch(/not in Node\.js/);
  });

  it('shows TypeScript’s words for type problems it has no plain version of', () => {
    expect(typeLines([{ text: 'Some rare message.', line: 4 }]).map(inEnglish)).toEqual(['TypeScript: Some rare message. (line 4)']);
  });
});
