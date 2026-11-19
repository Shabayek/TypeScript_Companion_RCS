// @vitest-environment node
import * as esbuild from 'esbuild-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import { decodeError } from '../src/content/decoder';
import { compileForSandbox } from '../src/runner/transform';
import { runSandboxInNode } from '../scripts/sandboxNode';
import { inEnglish } from '../src/i18n/messages';
import { msg } from '../src/i18n/text';
import { AWAIT_WITH_EXPORT } from '../src/runner/transform';

/**
 * The decoder must explain the errors learners actually see in this app: the
 * in-app compiler's wording for mistakes in the code, and the browser's
 * wording for errors while it runs. Each mistake below is run through the
 * real pipeline, and the message it produces must be decoded.
 */
const mistakes: Record<string, { code: string; entry: string }> = {
  'missing closing brace': { code: 'function f() {\n  return 1;\n', entry: 'unexpected-end' },
  'missing closing paren': { code: 'console.log("hi";', entry: 'expected-but-found' },
  'unclosed string': { code: 'const s = "hello;\nconsole.log(s);', entry: 'unterminated-string' },
  'stray closing brace': { code: 'const a = 1;\n}', entry: 'unexpected-symbol' },
  'reassigning a const': { code: 'const n = 1;\nn = 2;', entry: 'assign-to-constant-runtime' },
  'typo in a name': { code: 'const total = 1;\nconsole.log(totl);', entry: 'not-defined' },
  'calling a non-function': { code: 'const n = 5;\n(n as any)();', entry: 'not-a-function' },
  'reading from undefined': { code: 'const list: any[] = [];\nconsole.log(list[0].name);', entry: 'undefined-reading' },
  'endless recursion': { code: 'function f(): number { return f(); }\nf();', entry: 'stack-size' },
  'invalid JSON': { code: 'JSON.parse("{oops}");', entry: 'invalid-json' },
  'top-level await with export': { code: 'export const v = await Promise.resolve(1);', entry: 'cannot-mix' },
  'import in the playground': { code: 'import { readFile } from "fs";\nreadFile("a");', entry: 'import-here' },
};

async function messageFor(code: string): Promise<string> {
  try {
    const outcome = await runSandboxInNode(await compileForSandbox(esbuild.transform, code), []);
    return inEnglish(outcome.error ?? outcome.loadError ?? '(no error)');
  } catch (error) {
    const candidate = error as { errors?: { text: string }[] };
    const text = candidate.errors?.[0]?.text ?? String(error);
    // The app's own compile messages travel as tokens; the learner sees them worded.
    return text === AWAIT_WITH_EXPORT ? inEnglish(msg('runner.awaitWithExport')) : text;
  }
}

describe('error decoder coverage', () => {
  beforeAll(() => esbuild.transform('const warm = 1;', { loader: 'ts' }), 60_000);

  it.each(Object.entries(mistakes))('explains "%s"', async (_name, { code, entry }) => {
    const message = await messageFor(code);
    expect(decodeError(message)?.id, message).toBe(entry);
  }, 20_000);
});
