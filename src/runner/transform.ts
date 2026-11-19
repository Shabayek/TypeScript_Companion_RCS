import type { TransformOptions } from 'esbuild-wasm';

/** esbuild's `transform`, passed in so the browser worker and Node share this code. */
export type Transform = (code: string, options: TransformOptions) => Promise<{ code: string }>;

const BASE: TransformOptions = {
  loader: 'ts',
  // Learner code runs in the device's WebView (Chrome 90+ on Android), so
  // newer syntax is lowered to what it can run.
  target: 'es2020',
  logLevel: 'silent',
  jsx: 'preserve',
};

/** Top-level await mixed with export/import; see `runner.awaitWithExport`. */
export const AWAIT_WITH_EXPORT = '@await-export';

/** An esbuild-shaped failure, so callers can treat it like a compile error. */
function compileError(text: string): Error & { errors: { text: string; location: null }[] } {
  return Object.assign(new Error(text), { errors: [{ text, location: null }] });
}

function mentionsTopLevelAwait(error: unknown): boolean {
  const candidate = error as { errors?: { text?: string }[]; message?: string };
  const text = candidate.errors?.[0]?.text ?? candidate.message ?? '';
  return /top-level await/i.test(text);
}

/**
 * Compile learner TypeScript into a script that the sandbox runs inside a
 * function (see sandbox.ts).
 *
 * - CommonJS output turns `export` into harmless `module.exports` wiring,
 *   while every declaration stays a plain local the checks can see. `export`
 *   used to stop the program with "Unexpected token 'export'". A real
 *   `import` becomes `require(...)`, which the sandbox answers with a clear
 *   message: a single-file playground has nothing to import.
 * - Top-level `await` cannot be expressed in CommonJS, so that case is
 *   compiled as a plain module body. The sandbox runs code inside an `async`
 *   function, where `await` is valid.
 *
 * Throws esbuild's error for code that does not compile.
 */
export async function compileForSandbox(transform: Transform, code: string): Promise<string> {
  try {
    return (await transform(code, { ...BASE, format: 'cjs' })).code;
  } catch (error) {
    if (!mentionsTopLevelAwait(error)) throw error;
  }

  const result = await transform(code, {
    ...BASE,
    format: 'esm',
    supported: { 'top-level-await': true },
  });
  if (/^\s*(export|import)\b/m.test(result.code)) {
    // A token, worded by the app (runner.awaitWithExport) where it is shown.
    throw compileError(AWAIT_WITH_EXPORT);
  }
  return result.code;
}
