import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { writeOfflineFiles } from '../scripts/offlineBuild';
import { STORAGE_KEY } from '../src/storage/types';

/**
 * Service-worker updates (B4) with real deploys. Each "version" is a copy of
 * dist/ with its own title, restamped exactly as a new build would be; a tiny
 * server serves whichever version is currently "deployed".
 */

const ROOT = process.cwd();
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

let workDir = '';
let deployed = '';
let server: Server;
let origin = '';
let redirectingServer: Server;
let redirectingOrigin = '';

/**
 * Serves the currently deployed version. With `redirectIndex`, behaves like
 * hosts (Cloudflare Pages, Netlify) that redirect /index.html to /.
 */
async function serve(redirectIndex: boolean): Promise<{ server: Server; origin: string }> {
  const instance = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
    if (redirectIndex && path === '/index.html') {
      response.writeHead(308, { Location: '/' }).end();
      return;
    }
    const file = join(deployed, normalize(path === '/' ? '/index.html' : path));
    if (!file.startsWith(deployed) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => instance.listen(0, '127.0.0.1', resolve));
  const address = instance.address();
  return {
    server: instance,
    origin: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/`,
  };
}

function makeVersion(name: string, title: string, removeAfterStamping?: RegExp): string {
  const dir = join(workDir, name);
  cpSync(join(ROOT, 'dist'), dir, { recursive: true });
  const html = readFileSync(join(dir, 'index.html'), 'utf8').replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  writeFileSync(join(dir, 'index.html'), html);
  writeOfflineFiles(dir, join(ROOT, 'public', 'sw.js'));
  if (removeAfterStamping) {
    for (const file of readdirSync(join(dir, 'assets'))) {
      if (removeAfterStamping.test(file)) rmSync(join(dir, 'assets', file));
    }
  }
  return dir;
}

test.beforeAll(async () => {
  test.skip(!existsSync(join(ROOT, 'dist', 'sw.js')), 'Run `npm run build` first.');
  workDir = mkdtempSync(join(tmpdir(), 'tsc-sw-'));
  makeVersion('v1', 'TSC v1');
  makeVersion('v2', 'TSC v2');
  // A broken deploy: listed in its precache, but missing on the server.
  makeVersion('v3', 'TSC v3', /^CodeExercise-/);
  deployed = join(workDir, 'v1');

  ({ server, origin } = await serve(false));
  ({ server: redirectingServer, origin: redirectingOrigin } = await serve(true));
});

test.afterAll(async () => {
  for (const instance of [server, redirectingServer]) {
    await new Promise<void>((resolve) => (instance ? instance.close(() => resolve()) : resolve()));
  }
  if (workDir) rmSync(workDir, { recursive: true, force: true });
});

const deploy = (name: string) => (deployed = join(workDir, name));
const cacheNames = (page: Page) => page.evaluate(async () => (await caches.keys()).sort());

async function runOffline(page: Page, context: BrowserContext): Promise<string> {
  await context.setOffline(true);
  await page.goto(`${origin}#/playground`);
  await page.reload();
  await page.locator('.cm-content').waitFor();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  const text = await page.locator('.result-logs pre').innerText({ timeout: 20_000 });
  await context.setOffline(false);
  return text.trim();
}

test('deploys reach returning users, offline stays complete, broken deploys are refused (B4)', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);

  // First visit: the whole app, compiler included, works offline afterwards.
  await page.goto(origin);
  await page.evaluate(
    (key) => localStorage.setItem(key, JSON.stringify({ profile: { name: 'T', onboarded: true } })),
    STORAGE_KEY,
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  expect(await cacheNames(page)).toHaveLength(1);
  expect(await runOffline(page, context)).toBe('Hello, world!');
  await expect(page).toHaveTitle('TSC v1');

  // A new deploy: visible on the next online reload, offered in the app.
  deploy('v2');
  await page.goto(origin);
  await page.reload();
  await expect(page).toHaveTitle('TSC v2');
  const offer = page.getByText('A new version of the app is ready.');
  await expect(offer).toBeVisible({ timeout: 30_000 });
  expect(await cacheNames(page)).toHaveLength(2);

  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reload', exact: true }).click()]);
  await expect.poll(() => cacheNames(page)).toHaveLength(1);
  expect(await runOffline(page, context)).toBe('Hello, world!');
  await expect(page).toHaveTitle('TSC v2');

  // A broken deploy (a precached file is missing): the install is refused and
  // the complete previous version keeps working offline.
  deploy('v3');
  await page.goto(origin);
  await page.reload();
  await expect(page).toHaveTitle('TSC v3');
  await page.waitForTimeout(4000);
  await expect(offer).toHaveCount(0);
  expect(await cacheNames(page)).toHaveLength(1);

  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('TSC v2');
  await context.setOffline(false);
});

test('offline works on hosts that redirect /index.html to / (R3)', async ({ page, context }) => {
  test.setTimeout(120_000);
  deploy('v1');
  await page.goto(redirectingOrigin);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('TSC v1');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await context.setOffline(false);
});
