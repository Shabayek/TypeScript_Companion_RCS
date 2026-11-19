import { isNativeShell, reloadApp } from '../platform/capabilities';

/**
 * Service-worker registration and updates, browser build only.
 *
 * The worker makes reloads work offline once the first visit has finished
 * (see public/sw.js). Inside a Capacitor shell the assets are already local,
 * and a service worker only adds cache-invalidation problems, so it is skipped.
 *
 * Updates never interrupt a lesson: when a new version has finished
 * downloading, the app *offers* a reload, and the new worker takes over only
 * when the learner accepts.
 */

/** Check for a new version when the app returns to the foreground, at most this often. */
const UPDATE_CHECK_GAP_MS = 60 * 60 * 1000;
/** If the new worker does not take over in time, reload anyway. */
const TAKEOVER_TIMEOUT_MS = 4000;

let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<() => void>();

function setWaiting(worker: ServiceWorker | null): void {
  waitingWorker = worker;
  for (const listener of listeners) listener();
}

/** True when a new version is downloaded and ready to use after a reload. */
export function isUpdateReady(): boolean {
  return waitingWorker !== null;
}

/** Subscribe to "update ready" changes (for useSyncExternalStore). */
export function subscribeToUpdates(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Switch to the new version: ask the waiting worker to take over, then reload
 * once it controls the page. Reloading is safe for progress.
 */
export function applyUpdate(): void {
  const worker = waitingWorker;
  const container = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  if (!worker || !container || worker.state !== 'installed') {
    // Nothing left to hand over (another tab may already have switched):
    // a plain reload picks up the new version.
    reloadApp();
    return;
  }

  let reloaded = false;
  const reloadOnce = () => {
    if (reloaded) return;
    reloaded = true;
    reloadApp();
  };
  container.addEventListener('controllerchange', reloadOnce, { once: true });
  setTimeout(reloadOnce, TAKEOVER_TIMEOUT_MS);
  worker.postMessage({ type: 'SKIP_WAITING' });
}

/** Watch a registration for a worker that finished installing behind the current one. */
export function watchRegistration(
  registration: ServiceWorkerRegistration,
  container: ServiceWorkerContainer,
): void {
  // Only an *update* waits; the very first install has no page to replace.
  const offerIfUpdate = (worker: ServiceWorker | null) => {
    if (worker && worker.state === 'installed' && container.controller) setWaiting(worker);
  };
  const track = (worker: ServiceWorker | null) => {
    if (!worker) return;
    worker.addEventListener('statechange', () => offerIfUpdate(worker));
  };

  offerIfUpdate(registration.waiting);
  track(registration.installing);
  registration.addEventListener('updatefound', () => track(registration.installing));
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;
  if (isNativeShell()) return;

  const { protocol } = window.location;
  if (protocol !== 'http:' && protocol !== 'https:') return;

  window.addEventListener('load', () => {
    const container = navigator.serviceWorker;
    // `updateViaCache: 'none'`: always ask the server for sw.js itself, so a
    // new deploy is noticed on the next visit.
    container
      .register('./sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        watchRegistration(registration, container);

        // An installed app can stay open for days. Look for a new version
        // when it comes back to the foreground, at most once an hour.
        let lastCheck = Date.now();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return;
          if (Date.now() - lastCheck < UPDATE_CHECK_GAP_MS) return;
          lastCheck = Date.now();
          registration.update().catch(() => undefined);
        });
      })
      .catch(() => {
        // Offline caching is best-effort. The app works without it.
      });
  });
}
