// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface LockEntry {
  version?: string;
  resolved?: string;
  integrity?: string;
  link?: boolean;
  optionalDependencies?: Record<string, string>;
}

const lock = JSON.parse(readFileSync(join(__dirname, '..', 'package-lock.json'), 'utf8')) as {
  packages: Record<string, LockEntry>;
};

/**
 * `npm ci` installs exactly what the lockfile records. A lockfile written on
 * one machine can silently leave out another platform's native build (npm
 * skips optional packages it cannot resolve), and then `vite build` fails on
 * Windows or macOS with "Cannot find module @rollup/rollup-…".
 */
describe('package-lock.json', () => {
  it('records rollup’s native build for every platform rollup asks for', () => {
    const rollup = lock.packages['node_modules/rollup'];
    expect(rollup?.version).toBeTruthy();
    const platforms = Object.entries(rollup?.optionalDependencies ?? {}).filter(([name]) =>
      name.startsWith('@rollup/rollup-'),
    );
    expect(platforms.length).toBeGreaterThan(10);
    const missing = platforms
      .filter(([name, version]) => lock.packages[`node_modules/${name}`]?.version !== version)
      .map(([name, version]) => `${name}@${version}`);
    expect(missing).toEqual([]);
    for (const required of ['win32-x64-msvc', 'darwin-arm64', 'darwin-x64', 'linux-x64-gnu', 'linux-arm64-gnu']) {
      expect(lock.packages[`node_modules/@rollup/rollup-${required}`]).toBeDefined();
    }
  });

  it('pins every registry package with a download address and a checksum', () => {
    const incomplete = Object.entries(lock.packages)
      .filter(([path, entry]) => path !== '' && !entry.link)
      .filter(([, entry]) => !entry.resolved || !entry.integrity)
      .map(([path]) => path);
    expect(incomplete).toEqual([]);
  });
});
