// The package's real ES-module build. The bare 'esbuild-wasm' name resolves to
// a UMD/CommonJS file; the production bundler converted it, but the dev server
// served it as-is, so the code runner never worked under `npm run dev`.
import * as esbuild from 'esbuild-wasm/esm/browser.js';
import wasmUrl from 'esbuild-wasm/esbuild.wasm?url';
import type { CompileProblem, CompileResponse } from './types';
import { AWAIT_WITH_EXPORT, compileForSandbox } from './transform';
import { msg } from '../i18n/text';

interface CompileRequest {
  id: number;
  code: string;
}

let ready: Promise<void> | null = null;

/**
 * esbuild's wasm bundle is loaded once per worker and reused. A failed load is
 * *not* remembered: it used to be cached forever, so one bad moment (a dropped
 * download, memory pressure) disabled the checker until the app restarted.
 */
function prepare(): Promise<void> {
  if (!ready) {
    ready = esbuild.initialize({ wasmURL: wasmUrl, worker: false }).then(
      () => undefined,
      (error: unknown) => {
        ready = null;
        throw error;
      },
    );
  }
  return ready;
}

function toProblem(error: unknown): CompileProblem {
  const candidate = error as {
    errors?: { text: string; location?: { line: number; column: number } | null }[];
    message?: string;
  };
  const first = candidate.errors?.[0];
  if (first) {
    const line = first.location?.line;
    const column = first.location?.column;
    return {
      text: first.text === AWAIT_WITH_EXPORT ? msg('runner.awaitWithExport') : first.text,
      ...(typeof line === 'number' ? { line } : {}),
      ...(typeof column === 'number' ? { column } : {}),
    };
  }
  return { text: candidate.message ?? msg('runner.couldNotCompile') };
}

async function compile(code: string): Promise<CompileResponse> {
  try {
    await prepare();
  } catch (error) {
    // The compiler itself could not start. That is not a problem with the
    // learner's code, so it must not be reported as one ("One small syntax
    // fix first. Failed to fetch" used to appear for perfectly good code).
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      fatal: true,
      problems: [{ text: msg('runner.compilerCouldNotStartReason', { reason }) }],
    };
  }

  try {
    return { ok: true, code: await compileForSandbox(esbuild.transform, code) };
  } catch (error) {
    return { ok: false, problems: [toProblem(error)] };
  }
}

self.onmessage = (event: MessageEvent<CompileRequest>) => {
  const { id, code } = event.data;
  void compile(code)
    .then((response) => {
      self.postMessage({ id, ...response });
    })
    .catch((error: unknown) => {
      self.postMessage({
        id,
        ok: false,
        fatal: true,
        problems: [{ text: error instanceof Error ? error.message : msg('runner.compilerUnavailable') }],
      });
    });
};
