import ts from 'typescript';
import { createTypeChecker, type TypeChecker } from './typecheckCore';
import type { TypeCheckRequest } from './typecheckProtocol';

/**
 * The type-check worker. TypeScript itself is a large download, so it lives
 * in its own worker that only loads when code is first checked, and never
 * delays running code.
 */

// The ES2023 library (which includes ES2021, used in Classic mode), without
// the DOM: learner code has no page to touch. Only these files are bundled;
// the checker follows their references.
const libFiles = import.meta.glob(
  [
    '/node_modules/typescript/lib/lib.es5.d.ts',
    '/node_modules/typescript/lib/lib.es2015*.d.ts',
    '/node_modules/typescript/lib/lib.es2016*.d.ts',
    '/node_modules/typescript/lib/lib.es2017*.d.ts',
    '/node_modules/typescript/lib/lib.es2018*.d.ts',
    '/node_modules/typescript/lib/lib.es2019*.d.ts',
    '/node_modules/typescript/lib/lib.es2020*.d.ts',
    '/node_modules/typescript/lib/lib.es2021*.d.ts',
    '/node_modules/typescript/lib/lib.es2022*.d.ts',
    '/node_modules/typescript/lib/lib.es2023*.d.ts',
    '/node_modules/typescript/lib/lib.decorators*.d.ts',
    '!/node_modules/typescript/lib/lib.*.full.d.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const libs = new Map(Object.entries(libFiles).map(([path, text]) => [path.split('/').pop() ?? path, text]));
let checker: TypeChecker | null = null;

function answer(request: TypeCheckRequest): unknown {
  checker ??= createTypeChecker(ts, libs);
  switch (request.op) {
    case 'check':
      return checker.check(request.code, request.options);
    case 'inspect':
      return checker.inspect(request.code, request.options);
    case 'matchType':
      return checker.matchType(request.code, request.target, request.answer, request.options);
    case 'typeTests':
      return checker.typeTests(request.code, request.tests, request.options);
    default:
      throw new Error('Unknown request');
  }
}

self.onmessage = (event: MessageEvent<TypeCheckRequest & { id: number }>) => {
  const { id } = event.data;
  try {
    self.postMessage({ id, ok: true, value: answer(event.data) });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
