// @vitest-environment node
import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Screen text lives in the message catalogue (src/i18n/locales), never in a
 * component: otherwise it stays English when the learner switches language.
 * This finds words written straight into JSX, and into the attributes people
 * read (title, label, placeholder, aria-label…).
 */
const ROOT = join(__dirname, '..', 'src');
const READ_ATTRIBUTES = new Set(['title', 'label', 'placeholder', 'aria-label', 'legend', 'hint', 'alt', 'ariaLabel']);

/** What may stay as written: code, the logo, key names, language names of code. */
const ALLOWED: readonly RegExp[] = [
  /^TS$/,
  /^Ctrl K$/,
  /^typescript$/,
  /^npm run build · npx cap add android · npx cap sync$/,
  /^error TS\d+: /,
  /^\{"app":/,
];
/** Diagrams draw code fragments, which are never translated. */
const CODE_FILES = new Set([join('ui', 'Figures.tsx')]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

describe('no screen text outside the message catalogue', () => {
  it('finds no words written straight into components', () => {
    const found: string[] = [];
    for (const file of files(ROOT)) {
      const name = relative(ROOT, file);
      if (CODE_FILES.has(name)) continue;
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const where = (node: ts.Node) => `${name}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
      const visit = (node: ts.Node): void => {
        let text: string | null = null;
        if (ts.isJsxText(node)) text = node.getText().trim();
        else if (
          ts.isJsxAttribute(node) &&
          READ_ATTRIBUTES.has(node.name.getText()) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer)
        ) {
          text = node.initializer.text;
        }
        if (text && /[A-Za-z]{2,}/.test(text) && !ALLOWED.some((pattern) => pattern.test(text))) {
          found.push(`${where(node)} ${JSON.stringify(text.slice(0, 60))}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(found, 'move these into src/i18n/locales/en.ts and use t()').toEqual([]);
  });
});
