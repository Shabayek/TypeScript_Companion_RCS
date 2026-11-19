// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decodeError } from '../src/content/decoder';
import { typeCheckInNode } from '../scripts/typecheckNode';
import type { CheckOptions } from '../src/runner/typecheckCore';

/**
 * The decoder explains TypeScript's own messages too: each snippet below is
 * type-checked for real, and its first error must find the right entry.
 */
const cases: Record<string, { code: string; entry: string; options?: CheckOptions }> = {
  'a newer method on Classic': { code: 'const last = [1, 2].at(-1);', entry: 'newer-library', options: { engine: 'classic' } },
  'wrong argument type': { code: 'function double(n: number) { return n * 2; }\ndouble("2");', entry: 'argument-type' },
  'one missing property': { code: 'type Pet = { name: string; age: number };\nconst pet: Pet = { name: "Rex" };', entry: 'missing-property' },
  'several missing properties': { code: 'type User = { id: number; name: string; email: string };\nconst user: User = { name: "Ada" };', entry: 'missing-properties' },
  'an excess property': { code: 'type User = { name: string };\nconst user: User = { name: "Ada", nmae: "x" };', entry: 'excess-property' },
  'no overload': { code: 'const n = Math.max("1", 2);', entry: 'argument-type' },
  'using unknown': { code: 'const value: unknown = "x";\nvalue.toString();', entry: 'possibly-unknown' },
  'no ending return': { code: 'function f(x: number): number {\n  if (x > 0) return 1;\n}', entry: 'lacks-return' },
  'element implicitly any': { code: 'const settings = { theme: "dark" };\nfunction get(key: string) { return settings[key]; }', entry: 'element-implicit-any' },
  'used before assigned': { code: 'let total: number;\nconsole.log(total);', entry: 'used-before-assigned' },
  'class property not assigned': { code: 'class A {\n  name: string;\n}', entry: 'definitely-assigned' },
  'satisfies mismatch': { code: 'const routes = { home: 1 } satisfies Record<string, string>;', entry: 'not-assignable' },
  'a constraint': { code: 'function len<T extends { length: number }>(x: T) { return x.length; }\ntype L = Parameters<typeof len<number>>;', entry: 'constraint' },
  'stale expect-error': { code: '// @ts-expect-error\nconst fine = 1;', entry: 'unused-expect-error' },
  'override needed': { code: 'class A { f() {} }\nclass B extends A { f() {} }', entry: 'override-needed', options: { flags: { noImplicitOverride: true } } },
  'type used as value': { code: 'type User = { name: string };\nconst u = new User();', entry: 'only-a-type' },
  'abstract instance': { code: 'abstract class Animal {}\nnew Animal();', entry: 'abstract-instance' },
  'abstract member missing': { code: 'abstract class Animal { abstract sound(): string; }\nclass Dog extends Animal {}', entry: 'not-implemented-abstract' },
  'interface not implemented': { code: 'interface Shape { area(): number }\nclass Box implements Shape {}', entry: 'incorrectly-implements' },
};

describe('the error decoder knows TypeScript’s messages', () => {
  it.each(Object.entries(cases))('explains "%s"', (_name, { code, entry, options }) => {
    const [first] = typeCheckInNode(code, options);
    expect(first, 'expected a type error').toBeDefined();
    expect(decodeError(first?.text ?? '')?.id, first?.text).toBe(entry);
  });
});
