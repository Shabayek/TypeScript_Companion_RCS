import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installBackGuard } from '../src/platform/capabilities';

/** history.back() and wait for the popstate it causes. */
function back(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener('popstate', () => setTimeout(resolve, 0), { once: true });
    window.history.back();
  });
}

/** What the router does when the learner opens a page. */
function navigate(hash: string) {
  window.history.pushState({ idx: window.history.length }, '', hash);
}

describe('Android back guard (B14)', () => {
  let stop: () => void = () => undefined;

  beforeEach(() => {
    window.history.replaceState(null, '', '#/');
  });

  afterEach(() => {
    stop();
  });

  it('is silent on an ordinary "back to the map", hints once at the start, then lets the learner leave', async () => {
    const hint = vi.fn();
    stop = installBackGuard(hint);
    const lengthAfterInstall = window.history.length;

    navigate('#/learn/lesson-1');
    await back(); // lesson → map
    expect(window.location.hash).toBe('#/');
    expect(hint).not.toHaveBeenCalled();

    await back(); // map → the press that would have left the app
    expect(hint).toHaveBeenCalledTimes(1);

    // The guard did not push itself back in: the next back really leaves.
    expect(window.history.length).toBe(lengthAfterInstall + 1);
    expect(window.history.state).toBeNull();
  });

  it('hints on the first back when the learner never left the map', async () => {
    const hint = vi.fn();
    stop = installBackGuard(hint);
    await back();
    expect(hint).toHaveBeenCalledTimes(1);
  });

  it('does not stack sentinels when installed twice (StrictMode, reload)', () => {
    stop = installBackGuard(vi.fn());
    const length = window.history.length;
    stop();
    stop = installBackGuard(vi.fn());
    expect(window.history.length).toBe(length);
  });

  it('does nothing when the app starts on another page', async () => {
    window.history.replaceState(null, '', '#/learn/lesson-1');
    const hint = vi.fn();
    const length = window.history.length;
    stop = installBackGuard(hint);
    expect(window.history.length).toBe(length);
  });
});
