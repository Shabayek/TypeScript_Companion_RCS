import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/platform/capabilities', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/platform/capabilities')>()),
  reloadApp: vi.fn(),
}));

import { reloadApp } from '../src/platform/capabilities';

type Module = typeof import('../src/app/registerServiceWorker');

class FakeWorker extends EventTarget {
  postMessage = vi.fn();
  constructor(public state: ServiceWorkerState) {
    super();
  }
  become(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}

class FakeContainer extends EventTarget {
  constructor(public controller: object | null) {
    super();
  }
}

async function freshModule(): Promise<Module> {
  vi.resetModules();
  return import('../src/app/registerServiceWorker');
}

function watch(sw: Module, registration: FakeRegistration, container: FakeContainer) {
  sw.watchRegistration(
    registration as unknown as ServiceWorkerRegistration,
    container as unknown as ServiceWorkerContainer,
  );
}

describe('service worker update offer', () => {
  let container: FakeContainer;

  beforeEach(() => {
    vi.useFakeTimers();
    container = new FakeContainer({});
    Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(reloadApp).mockClear();
  });

  it('does not offer anything on the very first install', async () => {
    const sw = await freshModule();
    const registration = new FakeRegistration();
    const worker = new FakeWorker('installing');
    registration.installing = worker;
    watch(sw, registration, new FakeContainer(null));

    worker.become('installed');
    expect(sw.isUpdateReady()).toBe(false);
  });

  it('offers a reload once a new version has finished installing', async () => {
    const sw = await freshModule();
    const listener = vi.fn();
    sw.subscribeToUpdates(listener);
    const registration = new FakeRegistration();
    watch(sw, registration, container);

    const worker = new FakeWorker('installing');
    registration.installing = worker;
    registration.dispatchEvent(new Event('updatefound'));
    expect(sw.isUpdateReady()).toBe(false);

    worker.become('installed');
    expect(sw.isUpdateReady()).toBe(true);
    expect(listener).toHaveBeenCalled();
  });

  it('offers an update that was already waiting when the app opened', async () => {
    const sw = await freshModule();
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker('installed');
    watch(sw, registration, container);
    expect(sw.isUpdateReady()).toBe(true);
  });

  it('switches only when asked: tells the new worker to take over, then reloads', async () => {
    const sw = await freshModule();
    const registration = new FakeRegistration();
    const worker = new FakeWorker('installed');
    registration.waiting = worker;
    watch(sw, registration, container);

    expect(worker.postMessage).not.toHaveBeenCalled();
    sw.applyUpdate();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reloadApp).not.toHaveBeenCalled();

    container.dispatchEvent(new Event('controllerchange'));
    expect(reloadApp).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10_000);
    expect(reloadApp).toHaveBeenCalledTimes(1);
  });

  it('reloads anyway if the new worker does not take over in time', async () => {
    const sw = await freshModule();
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker('installed');
    watch(sw, registration, container);

    sw.applyUpdate();
    vi.advanceTimersByTime(4000);
    expect(reloadApp).toHaveBeenCalledTimes(1);
  });

  it('just reloads when another tab already switched to the new version', async () => {
    const sw = await freshModule();
    const registration = new FakeRegistration();
    const worker = new FakeWorker('installed');
    registration.waiting = worker;
    watch(sw, registration, container);

    worker.state = 'activated';
    sw.applyUpdate();
    expect(worker.postMessage).not.toHaveBeenCalled();
    expect(reloadApp).toHaveBeenCalledTimes(1);
  });
});
