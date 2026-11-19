/**
 * Android-readiness scan for the built bundle.
 *
 * Runs on plain Node (type stripping, Node >= 22.18) so it has no build step
 * and no dependencies beyond `node:fs` / `node:path`. If this fails, the build
 * fails: an absolute path or a remote URL would break the app inside a
 * Capacitor WebView.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { Script } from 'node:vm';

const DIST = resolve(process.cwd(), 'dist');
const TEXT_FILES = new Set([
  '.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.map',
]);
/** XML and SVG namespace identifiers. They look like URLs, but nothing fetches them. */
const ALLOWED_NAMESPACES = [
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xlink',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/2000/xmlns/',
  'http://www.w3.org/XML/1998/namespace',
  'http://www.w3.org/1998/Math/MathML',
];

/**
 * Static strings inside bundled vendor code that look like URLs but are never
 * requested. Each is matched exactly and justified here, rather than silenced
 * by file name or by pattern, so a library upgrade that introduces a real
 * remote fetch still fails the build.
 */
const INERT_VENDOR_URLS: readonly { readonly url: string; readonly why: string }[] = [
  { url: 'https://reactjs.org/docs/error-decoder.html?invariant=', why: 'React error-message link' },
  { url: 'https://github.com/pmndrs/zustand/discussions/1937', why: 'Zustand warning link' },
  { url: 'http://${t.url}', why: 'markdown-it punycode normalisation template' },
];

/**
 * The type-check worker bundles TypeScript and its standard-library
 * declarations, whose text contains documentation links: licence headers,
 * MDN / Unicode / ISO references in doc comments, and aka.ms / GitHub links in
 * compiler messages. None is ever requested — the worker uses no network API
 * (checked below), and the page's CSP forbids connections anyway. The links
 * are allowed by host and only in that one file, so a new host (or a network
 * call) still fails the build.
 */
const TYPECHECK_WORKER = /^assets\/typecheck\.worker-[\w-]+\.js$/;
const TYPECHECK_DOC_HOSTS = new Set([
  'www.apache.org',
  'developer.mozilla.org',
  'unicode.org',
  'cldr.unicode.org',
  'tc39.es',
  'tools.ietf.org',
  'www.iso.org',
  'www.currency-iso.org',
  'unstats.un.org',
  'aka.ms',
  'github.com',
]);
const NETWORK_APIS = /\bfetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts/;

function hostOf(url: string): string {
  try {
    return new URL(url.replace(/[.,;:]+$/, '')).host;
  } catch {
    return url;
  }
}

const problems: string[] = [];

function fail(message: string): void {
  problems.push(message);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('check:android — dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

const files = walk(DIST);

// 1. The entry point must exist and must not hard-code an absolute root.
const indexHtml = join(DIST, 'index.html');
if (!existsSync(indexHtml)) fail('dist/index.html is missing');

const manifestFile = join(DIST, 'manifest.webmanifest');
if (!existsSync(manifestFile)) fail('dist/manifest.webmanifest is missing');

// 2. Text assets must not reference the network or absolute paths.
for (const file of files) {
  const extension = extname(file).toLowerCase();
  if (!TEXT_FILES.has(extension)) continue;

  const rel = relative(DIST, file).split(sep).join('/');
  let text = readFileSync(file, 'utf8');

  for (const namespace of ALLOWED_NAMESPACES) {
    text = text.split(namespace).join('');
  }
  for (const inert of INERT_VENDOR_URLS) {
    text = text.split(inert.url).join('');
  }

  let urlMatches: string[] = text.match(/https?:\/\/[^\s"'`()<>\\]+/g) ?? [];
  if (TYPECHECK_WORKER.test(rel)) {
    if (NETWORK_APIS.test(text)) fail(`${rel}: the type-check worker contains a network API`);
    urlMatches = urlMatches.filter((url) => !TYPECHECK_DOC_HOSTS.has(hostOf(url)));
  }
  for (const url of urlMatches) {
    fail(`${rel}: remote URL ${url}`);
  }

  if (extension === '.html' || extension === '.css' || extension === '.json' || extension === '.webmanifest') {
    // src="/assets/…", href='/x', url(/x) — absolute roots break under a WebView.
    const absolute = text.match(/(?:src|href|url)\s*[=(]\s*["']?\/(?!\/)/g) ?? [];
    for (const match of absolute) {
      fail(`${rel}: absolute path reference ${match.trim()}`);
    }
  }
}

// 3. Every asset referenced by the manifest and the HTML must exist.
const required = [
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
  'sw.js',
  'asset-manifest.json',
];
for (const name of required) {
  if (!existsSync(join(DIST, name))) fail(`dist/${name} is referenced but missing`);
}

// 4. Fonts shipped by @fontsource must be present whenever CSS asks for them.
//    Resolve each `url(...)` against the stylesheet that contains it: Vite
//    writes `./inter-*.woff2` from a CSS file in assets/, so the fonts sit
//    beside it, not at the bundle root.
const cssFiles = files.filter((file) => extname(file).toLowerCase() === '.css');
for (const cssFile of cssFiles) {
  const cssRel = relative(DIST, cssFile).split(sep).join('/');
  const cssText = readFileSync(cssFile, 'utf8');
  for (const match of cssText.matchAll(/url\(([^)]+\.woff2?)\)/g)) {
    const raw = match[1] ?? '';
    const cleaned = raw.replace(/^['"]|['"]$/g, '').split(/[?#]/)[0] ?? raw;
    if (cleaned.startsWith('data:') || /^https?:/i.test(cleaned)) continue;
    const target = cleaned.startsWith('/')
      ? join(DIST, cleaned.slice(1))
      : resolve(dirname(cssFile), cleaned);
    if (!existsSync(target)) fail(`font file missing: ${cleaned} (referenced by ${cssRel})`);
  }
}

// 5. The service worker must parse as a classic script. A syntax error here
//    would only show up later as "offline loading does not work".
const swFile = join(DIST, 'sw.js');
if (existsSync(swFile)) {
  try {
    new Script(readFileSync(swFile, 'utf8'), { filename: 'sw.js' });
  } catch (error) {
    fail(`dist/sw.js does not parse: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 6. The service worker's precache list must point at files that exist.
const assetManifestFile = join(DIST, 'asset-manifest.json');
if (existsSync(assetManifestFile)) {
  try {
    const listed: unknown = JSON.parse(readFileSync(assetManifestFile, 'utf8'));
    if (!Array.isArray(listed)) {
      fail('asset-manifest.json is not an array of paths');
    } else {
      for (const entry of listed) {
        if (typeof entry !== 'string' || !entry.startsWith('./')) {
          fail(`asset-manifest.json contains an unusable entry: ${JSON.stringify(entry)}`);
          continue;
        }
        if (!existsSync(join(DIST, entry.slice(2)))) {
          fail(`asset-manifest.json lists a missing file: ${entry}`);
        }
      }
    }
  } catch {
    fail('asset-manifest.json is not valid JSON');
  }
}

// 6b. The worker must be stamped by the build: a build id (so browsers see a
//     new version) and the same precache list as asset-manifest.json.
if (existsSync(swFile)) {
  const swText = readFileSync(swFile, 'utf8');
  if (swText.includes('__TSC_BUILD_ID__') || swText.includes('__TSC_PRECACHE__')) {
    fail('dist/sw.js was not stamped by the build (placeholders are still present)');
  } else {
    if (!/const BUILD_ID = '[0-9a-f]{12}';/.test(swText)) fail('dist/sw.js has no build id');
    const inline = /const PRECACHE = (\[[\s\S]*?\]);/.exec(swText)?.[1];
    try {
      const fromWorker: unknown = inline ? JSON.parse(inline) : null;
      const fromManifest: unknown = JSON.parse(readFileSync(assetManifestFile, 'utf8'));
      if (JSON.stringify(fromWorker) !== JSON.stringify(fromManifest)) {
        fail('dist/sw.js precache list differs from asset-manifest.json');
      }
    } catch {
      fail('dist/sw.js precache list could not be read');
    }
  }
}

// 7. A base that is not relative would produce absolute asset URLs.
if (!indexHtml || !existsSync(indexHtml)) {
  // Already reported above.
} else {
  const html = readFileSync(indexHtml, 'utf8');
  if (/<base\s+href=["']\//i.test(html)) fail('index.html sets an absolute <base href>');
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) fail('index.html has no viewport meta tag');
  if (!/viewport-fit=cover/i.test(html)) {
    fail('index.html viewport is missing viewport-fit=cover (safe areas)');
  }
}

// 8. Report.
if (problems.length > 0) {
  console.error(`check:android — ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}

console.log(
  `check:android — clean: ${files.length} files, no undeclared remote URLs, no absolute asset paths, every font and precached file present.`,
);
