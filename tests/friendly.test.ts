// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import { explainMessage, hasCurlyQuotes, straightenQuotes } from '../src/runner/friendly';
import { problemLines, runtimeLines } from '../src/runner/grade';
import { compileForSandbox } from '../src/runner/transform';
import { runSandboxInNode } from '../scripts/sandboxNode';
import { inEnglish } from '../src/i18n/messages';

/** The first mistakes a beginner makes, as they really come out of the pipeline. */
const firstMistakes: Record<string, string> = {
  'text without quotes': 'const greeting = Hello, world;\nconsole.log(greeting);',
  'curly quotes from a phone keyboard': 'console.log(“hello”);',
  'a missing closing quote': 'console.log("hello);',
  'a missing closing brace': 'function f() {\n  return 1;\n',
  'a missing closing bracket': 'console.log("hi";',
  'a stray closing brace': 'const a = 1;\n}',
  'a typo in a name': 'const total = 1;\nconsole.log(totl);',
  'changing a const': 'const n = 1;\nn = 2;',
  'reading from nothing': 'const list: any[] = [];\nconsole.log(list[0].name);',
  'calling a non-function': 'const n: any = 5;\nn();',
  'endless recursion': 'function f(): number { return f(); }\nf();',
};

async function firstMessage(code: string): Promise<{ kind: 'compile' | 'runtime'; message: string }> {
  try {
    const outcome = await runSandboxInNode(await compileForSandbox(esbuild.transform, code), []);
    return { kind: 'runtime', message: inEnglish(outcome.error ?? outcome.loadError ?? '') };
  } catch (error) {
    return { kind: 'compile', message: (error as { errors?: { text: string }[] }).errors?.[0]?.text ?? String(error) };
  }
}

describe('plain language for the first mistakes (E1)', () => {
  beforeAll(() => esbuild.transform('const warm = 1;', { loader: 'ts' }), 60_000);

  it.each(Object.entries(firstMistakes))('explains %s', async (_name, code) => {
    const { kind, message } = await firstMessage(code);
    expect(message).not.toBe('');
    const friendly = explainMessage(message);
    expect(friendly, message).not.toBeNull();
    // The explanation comes first; the exact message is still shown.
    const lines = (kind === 'compile' ? problemLines([{ text: message, line: 1 }]) : runtimeLines(message)).map(inEnglish);
    expect(lines[0]).toContain(friendly ? inEnglish(friendly) : '');
    expect(lines.join(' ')).toContain(message);
  }, 20_000);

  it('tells a learner who forgot quotes to put the text in quotes', () => {
    expect(inEnglish(explainMessage('The constant "world" must be initialized')!)).toMatch(/put the whole text in quotes/);
  });

  it('leaves messages it does not know alone', () => {
    expect(explainMessage('Something nobody has seen before')).toBeNull();
    expect(problemLines([{ text: 'Something nobody has seen before', line: 3 }]).map(inEnglish)).toEqual(['Something nobody has seen before (line 3)']);
  });
});

describe('curly quotes (E2)', () => {
  it('finds and straightens curly quotes', () => {
    expect(hasCurlyQuotes('console.log(“hi”)')).toBe(true);
    expect(hasCurlyQuotes('console.log("hi")')).toBe(false);
    expect(straightenQuotes('console.log(“hi”, ‘there’)')).toBe(`console.log("hi", 'there')`);
  });

  it('straightened code compiles and runs', async () => {
    const js = await compileForSandbox(esbuild.transform, straightenQuotes('console.log(“hello”);'));
    expect((await runSandboxInNode(js, [])).logs).toEqual(['hello']);
  }, 20_000);
});
