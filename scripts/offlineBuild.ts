/**
 * Build-time half of the offline service worker.
 *
 * After Vite has written `dist/`, this stamps `dist/sw.js` with:
 *
 * - a build id derived from the *contents* of every built file, so any change
 *   to the app changes the bytes of `sw.js`. Browsers only install a new
 *   service worker when `sw.js` changes; the old hand-written file never did,
 *   which pinned every returning visitor to the first version they installed.
 * - the precache list itself, so a worker and its asset list can never come
 *   from two different builds (a separately fetched list could be stale).
 *
 * `asset-manifest.json` is still written for the Android scan and for people.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const BUILD_ID_TOKEN = '__TSC_BUILD_ID__';
export const PRECACHE_TOKEN = '/* __TSC_PRECACHE__ */ []';

/** Files the worker must not precache: itself, and the human-readable list. */
const NOT_PRECACHED = new Set(['sw.js', 'asset-manifest.json']);

/** Every built file, as sorted `./relative/posix` paths, minus the worker's own files. */
export function listPrecacheFiles(dist: string): string[] {
  const walk = (dir: string): string[] => {
    const found: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) found.push(...walk(full));
      else found.push(full);
    }
    return found;
  };

  return walk(dist)
    .map((file) => relative(dist, file).split(sep).join('/'))
    .filter((file) => !NOT_PRECACHED.has(file))
    .sort()
    .map((file) => `./${file}`);
}

/**
 * A short id that changes whenever any precached file's name or bytes change,
 * or the worker's own code (`workerSource`) changes. The worker code must count:
 * a worker update with an unchanged id would share the running worker's cache,
 * and a failed install would then delete that complete cache.
 */
export function computeBuildId(dist: string, files: readonly string[], workerSource = ''): string {
  const hash = createHash('sha256');
  hash.update('worker\0').update(workerSource).update('\n');
  for (const file of files) {
    const bytes = readFileSync(join(dist, file.slice(2)));
    hash.update(file).update('\0').update(createHash('sha256').update(bytes).digest('hex')).update('\n');
  }
  return hash.digest('hex').slice(0, 12);
}

/** Fill the template's placeholders. Throws if the template lost one. */
export function renderServiceWorker(template: string, buildId: string, precache: readonly string[]): string {
  if (!template.includes(BUILD_ID_TOKEN) || !template.includes(PRECACHE_TOKEN)) {
    throw new Error('public/sw.js is missing the build-id or precache placeholder');
  }
  return template
    .split(BUILD_ID_TOKEN)
    .join(buildId)
    .split(PRECACHE_TOKEN)
    .join(JSON.stringify(precache, null, 2));
}

/** Writes the stamped `sw.js` and `asset-manifest.json` into `dist`. */
export function writeOfflineFiles(dist: string, templatePath: string): { buildId: string; precache: string[] } {
  const precache = listPrecacheFiles(dist);
  const template = readFileSync(templatePath, 'utf8');
  const buildId = computeBuildId(dist, precache, template);

  writeFileSync(join(dist, 'sw.js'), renderServiceWorker(template, buildId, precache));
  writeFileSync(join(dist, 'asset-manifest.json'), `${JSON.stringify(precache, null, 2)}\n`);
  return { buildId, precache };
}
