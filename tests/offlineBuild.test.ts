// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Script } from 'node:vm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  computeBuildId,
  listPrecacheFiles,
  renderServiceWorker,
  writeOfflineFiles,
} from '../scripts/offlineBuild';

const TEMPLATE = join(__dirname, '..', 'public', 'sw.js');

describe('offline build stamping', () => {
  let dist: string;

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'tsc-dist-'));
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'index.html'), '<script src="./assets/index-aaa.js"></script>');
    writeFileSync(join(dist, 'assets', 'index-aaa.js'), 'console.log(1)');
    writeFileSync(join(dist, 'sw.js'), 'old worker');
    writeFileSync(join(dist, 'asset-manifest.json'), '[]');
  });

  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it('precaches every built file except the worker and its list, as sorted relative paths', () => {
    expect(listPrecacheFiles(dist)).toEqual(['./assets/index-aaa.js', './index.html']);
  });

  it('keeps the same build id for identical output, so nobody gets a pointless update', () => {
    const files = listPrecacheFiles(dist);
    expect(computeBuildId(dist, files)).toBe(computeBuildId(dist, files));
    expect(computeBuildId(dist, files)).toMatch(/^[0-9a-f]{12}$/);
  });

  it('changes the build id when any file changes, so browsers install the update', () => {
    const files = listPrecacheFiles(dist);
    const before = computeBuildId(dist, files);
    writeFileSync(join(dist, 'index.html'), '<title>v2</title>');
    expect(computeBuildId(dist, files)).not.toBe(before);
  });

  it('changes the build id when only the worker code changes, so it never shares a cache with the old worker', () => {
    const files = listPrecacheFiles(dist);
    expect(computeBuildId(dist, files, 'worker v1')).not.toBe(computeBuildId(dist, files, 'worker v2'));
  });

  it('writes a worker that parses, names its build, and lists the files', () => {
    const { buildId, precache } = writeOfflineFiles(dist, TEMPLATE);
    const worker = readFileSync(join(dist, 'sw.js'), 'utf8');

    expect(() => new Script(worker)).not.toThrow();
    expect(worker).toContain(`const BUILD_ID = '${buildId}';`);
    expect(worker).not.toContain('__TSC_');
    expect(worker).toContain('"./assets/index-aaa.js"');
    expect(JSON.parse(readFileSync(join(dist, 'asset-manifest.json'), 'utf8'))).toEqual(precache);
  });

  it('refuses a template without its placeholders instead of shipping an unversioned worker', () => {
    expect(() => renderServiceWorker('self.addEventListener("fetch", () => {})', 'abc', [])).toThrow(
      /placeholder/,
    );
  });
});
