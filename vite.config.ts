import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeOfflineFiles } from './scripts/offlineBuild';

/**
 * The app ships with a strict Content-Security-Policy so that any accidental
 * network access fails loudly. Dev needs three relaxations that production does
 * not: HMR websockets, style injection, and the React refresh preamble.
 * Production keeps `connect-src 'none'` — this is the offline guarantee.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'tsc-csp',
    transformIndexHtml(html, ctx) {
      if (ctx.server) {
        return html
          .replace("connect-src 'none'", "connect-src 'self' ws: http: https:")
          .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");
      }
      return html;
    },
  };
}

/**
 * Stamps `dist/sw.js` with a content-derived build id and the exact list of
 * built files, and writes `asset-manifest.json` beside it. A new build always
 * produces a new `sw.js`, so browsers install updates; the worker precaches
 * every file on install, so one visit is enough for a fully offline reload.
 * See scripts/offlineBuild.ts and public/sw.js.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: 'tsc-offline-sw',
    apply: 'build',
    closeBundle() {
      const root = fileURLToPath(new URL('.', import.meta.url));
      writeOfflineFiles(join(root, 'dist'), join(root, 'public', 'sw.js'));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), contentSecurityPolicy(), offlineServiceWorker()],
  build: {
    target: 'chrome90',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'zustand'],
        },
      },
    },
  },
  // esbuild-wasm is imported from its ES-module build (esm/browser.js) and its
  // wasm file by explicit URL, so it needs no pre-bundling.
  optimizeDeps: { exclude: ['esbuild-wasm'] },
  worker: { format: 'es', plugins: () => [] },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    // The type checker and the compiler start cold in several test files at
    // once; the first test of such a file can take a few seconds on a busy
    // machine.
    testTimeout: 30_000,
  },
});
