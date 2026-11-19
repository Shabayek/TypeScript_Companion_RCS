/*
 * The offline service worker. Hand-written, same-origin only, no libraries.
 *
 * This file is a template: the build (scripts/offlineBuild.ts) stamps in the
 * build id and the exact list of built files. A new build therefore always
 * produces a new sw.js, which is what makes browsers install updates.
 *
 * Strategy:
 * - Install: download *every* built file into a cache named after this build.
 *   All or nothing — if one file fails, the install fails and the previous
 *   version keeps serving a complete app. A half-filled cache used to be
 *   treated as "offline ready" and then crashed offline on the missing file.
 * - Navigations (opening or reloading the app): network first, so an update is
 *   seen as soon as it is online; the cached shell when offline or very slow.
 * - Everything else: cache first. Built file names contain content hashes,
 *   so a cached file is never stale.
 * - Updates wait. The page shows "a new version is ready" and asks the
 *   worker to take over only when the learner chooses to reload.
 *
 * The browser build only: registration is skipped inside a Capacitor shell
 * (see src/app/registerServiceWorker.ts).
 */
const BUILD_ID = '__TSC_BUILD_ID__';
const PRECACHE = /* __TSC_PRECACHE__ */ [];

const CACHE_PREFIX = 'ts-companion-';
const CACHE = `${CACHE_PREFIX}${BUILD_ID}`;
/** The app shell, in order of preference for answering a navigation. */
const SHELL = ['./', './index.html'];
/** How long a navigation waits for the network before using the cached shell. */
const NAVIGATION_TIMEOUT_MS = 3500;

/**
 * `ignoreVary` matters: preview servers (and some static hosts) add
 * `Vary: Origin` to asset responses, while precached entries were stored
 * without that header. Without this flag every asset looks like a miss.
 */
function fromCache(request) {
  return caches.open(CACHE).then((cache) => cache.match(request, { ignoreVary: true }));
}

/**
 * A stored copy that can answer a page navigation. Browsers refuse a
 * *redirected* response as the answer to a navigation, and some hosts redirect
 * `/index.html` to `/` (Cloudflare Pages, Netlify). Caching that response
 * as-is made every offline reload on such a host fail.
 */
async function storable(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function precache() {
  const cache = await caches.open(CACHE);
  // `cache: 'reload'` skips the HTTP cache, so the shell and the assets always
  // come from the same deploy. All or nothing: nothing is stored unless every
  // file arrived.
  const urls = [...new Set(['./', ...PRECACHE])];
  try {
    const entries = await Promise.all(
      urls.map(async (url) => {
        const request = new Request(url, { cache: 'reload' });
        const response = await fetch(request);
        if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
        return [request, await storable(response)];
      }),
    );
    await Promise.all(entries.map(([request, response]) => cache.put(request, response)));
  } catch (error) {
    await caches.delete(CACHE);
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Every older build, including the fixed-name 'ts-companion-v3'
            // cache from before builds were versioned. Only now that this
            // version is complete and in charge.
            .filter((key) => key !== CACHE && key.startsWith(CACHE_PREFIX))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/** The first stored shell entry. */
async function cachedShell() {
  for (const url of SHELL) {
    const cached = await fromCache(url);
    if (cached) return cached;
  }
  return undefined;
}

/** Network first with a time limit; the cached shell offline or on a stalled network. */
function handleNavigation(request) {
  const network = fetch(request, { cache: 'no-cache' });
  const fallback = () => cachedShell().then((cached) => cached || Response.error());

  return new Promise((resolve) => {
    let settled = false;
    const finish = (response) => {
      if (settled) return;
      settled = true;
      resolve(response);
    };

    const timer = setTimeout(() => {
      cachedShell().then((cached) => {
        if (cached) finish(cached);
      });
    }, NAVIGATION_TIMEOUT_MS);

    network
      .then((response) => {
        clearTimeout(timer);
        // The network answered: use it, even if it is an error page, unless
        // the server is simply unreachable for this app (5xx) and we have a shell.
        if (response.status >= 500) {
          fallback().then((cached) => finish(cached.type === 'error' ? response : cached));
        } else {
          finish(response);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        fallback().then(finish);
      });
  });
}

function handleAsset(request) {
  return fromCache(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      // Not part of this build's precache (e.g. a file an older page still
      // asks for). Keep a copy so it also works offline next time.
      if (response && response.status === 200 && response.type === 'basic') {
        const copy = response.clone();
        caches
          .open(CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => undefined);
      }
      return response;
    });
    // A network failure propagates as a failed request. Returning HTML for a
    // missing script would turn it into a confusing MIME-type error.
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(request.mode === 'navigate' ? handleNavigation(request) : handleAsset(request));
});
