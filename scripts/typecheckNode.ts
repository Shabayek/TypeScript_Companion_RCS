/**
 * The app's type checker (src/runner/typecheckCore.ts) in Node, for the
 * content validator and tests. Library files come from the installed
 * `typescript` package, found the same way the browser build finds them:
 * starting at each engine's root library and following its references.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { LIB_ROOTS, createTypeChecker, type CheckOptions, type TypeChecker, type TypeProblem } from '../src/runner/typecheckCore';

function loadLibs(): Map<string, string> {
  const dir = dirname(createRequire(import.meta.url).resolve('typescript/lib/lib.es5.d.ts'));
  const libs = new Map<string, string>();
  const visit = (file: string) => {
    if (libs.has(file)) return;
    const text = readFileSync(join(dir, file), 'utf8');
    libs.set(file, text);
    for (const match of text.matchAll(/<reference lib="([^"]+)"/g)) visit(`lib.${match[1]}.d.ts`);
  };
  for (const root of Object.values(LIB_ROOTS)) visit(root);
  return libs;
}

let checker: TypeChecker | null = null;

/** The shared checker (every operation: check, inspect, typeOf, matchType, typeTests). */
export function nodeTypeChecker(): TypeChecker {
  checker ??= createTypeChecker(ts, loadLibs());
  return checker;
}

/** Type errors in `code`; Classic (ES2021) unless the options say otherwise. */
export function typeCheckInNode(code: string, options: CheckOptions = {}): TypeProblem[] {
  return nodeTypeChecker().check(code, options);
}
