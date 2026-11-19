import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { __setStateForTests, nextUpLessonId, startPersistence, useJourney } from '../src/storage/store';
import { STORAGE_KEY, defaultState } from '../src/storage/types';
import { encodeState, toEnvelope } from '../src/storage/model';

const first = ALL_LESSONS[0];
const second = ALL_LESSONS[1];

if (!first || !second) throw new Error('The course needs at least two lessons for these tests.');
const firstId = first.id;

describe('journey store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    __setStateForTests(defaultState(1000));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hydrates from storage and marks itself ready', async () => {
    const saved = defaultState(2000);
    saved.profile.name = 'Saved learner';
    saved.profile.onboarded = true;
    window.localStorage.setItem(STORAGE_KEY, encodeState(saved));

    useJourney.setState({ hydrated: false });
    await useJourney.getState().hydrate();

    expect(useJourney.getState().hydrated).toBe(true);
    expect(useJourney.getState().state.profile.name).toBe('Saved learner');
  });

  it('starts fresh when storage holds nothing', async () => {
    await useJourney.getState().hydrate();
    expect(useJourney.getState().state.lessons).toEqual({});
  });

  it('records results and persists them after the debounce', () => {
    useJourney.getState().recordResult(first.id, 'read', true, false);
    const stored = useJourney.getState().state.lessons[first.id]?.steps.read;
    expect(stored).toMatchObject({ solved: true, attempts: 1 });

    vi.advanceTimersByTime(500);
    const onDisk = window.localStorage.getItem(STORAGE_KEY);
    expect(onDisk).toContain(first.id);
  });

  it('remembers the revealed answer', () => {
    useJourney.getState().reveal(first.id, 'read');
    expect(useJourney.getState().state.lessons[first.id]?.steps.read?.revealed).toBe(true);
  });

  it('tracks the open lesson and step', () => {
    useJourney.getState().goToStep(first.id, 2);
    expect(useJourney.getState().state.lastLessonId).toBe(first.id);
    expect(useJourney.getState().state.lessons[first.id]?.stepIndex).toBe(2);
    expect(useJourney.getState().openedAt).not.toBeNull();
  });

  it('finishes a lesson and returns only the new badges', () => {
    useJourney.getState().goToStep(first.id, 0);
    const { badges } = useJourney.getState().finishLesson(first.id);
    expect(badges).toContain('first-steps');
    expect(useJourney.getState().state.lessons[first.id]?.status).toBe('completed');

    const again = useJourney.getState().finishLesson(first.id).badges;
    expect(again).not.toContain('first-steps');
    expect(useJourney.getState().state.badges.filter((id) => id === 'first-steps')).toHaveLength(1);
  });

  it('suggests the next unfinished lesson', () => {
    expect(nextUpLessonId(useJourney.getState().state)).toBe(first.id);

    useJourney.getState().finishLesson(first.id);
    expect(nextUpLessonId(useJourney.getState().state)).toBe(second.id);
  });

  it('patches settings and profile without dropping the rest', () => {
    useJourney.getState().patchSettings({ theme: 'dark', textSize: 4 });
    useJourney.getState().setProfile({ name: 'Sam', onboarded: true });

    const state = useJourney.getState().state;
    expect(state.settings).toMatchObject({ theme: 'dark', textSize: 4 });
    expect(state.settings.mode).toBe(defaultState().settings.mode);
    expect(state.profile.name).toBe('Sam');
    expect(state.profile.onboarded).toBe(true);
  });

  it('resets the journey but keeps the learner set up', () => {
    useJourney.getState().setProfile({ name: 'Ada', onboarded: true });
    useJourney.getState().patchSettings({ font: 'dyslexia' });
    useJourney.getState().recordResult(first.id, 'read', true, false);

    useJourney.getState().reset();
    const state = useJourney.getState().state;
    expect(state.lessons).toEqual({});
    expect(state.profile.onboarded).toBe(true);
    expect(state.profile.name).toBe('Ada');
    expect(state.settings.font).toBe('dyslexia');
  });

  it('exports an envelope and can import it again', () => {
    useJourney.getState().setProfile({ name: 'Grace', onboarded: true });
    const json = useJourney.getState().exportJson();
    expect(JSON.parse(json).app).toBe('typescript-companion');

    useJourney.getState().reset();
    __setStateForTests(defaultState(1));
    const result = useJourney.getState().replaceState(json);
    expect(result.ok).toBe(true);
    expect(useJourney.getState().state.profile.name).toBe('Grace');
  });

  it('refuses files with no progress in them', () => {
    const empty = toEnvelope(defaultState(1));
    expect(useJourney.getState().replaceState(JSON.stringify(empty))).toMatchObject({ ok: false });

    expect(useJourney.getState().replaceState('not json at all')).toMatchObject({ ok: false });
  });
});

describe('journey store persistence safety', () => {
  const onDisk = () => window.localStorage.getItem(STORAGE_KEY);

  function savedLearner() {
    const saved = defaultState(2000);
    saved.profile = { name: 'Saved learner', onboarded: true, createdAt: 2000, experience: null };
    saved.lessons[firstId] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 10, completedAt: 5 };
    saved.badges = ['first-steps'];
    return saved;
  }

  /** A cold start: the store holds the default state and has not read storage yet. */
  function coldStart() {
    __setStateForTests(defaultState(1000));
    useJourney.setState({ hydrated: false });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('never writes the default state over saved progress before hydration (reload on a lesson page)', async () => {
    const saved = encodeState(savedLearner());
    window.localStorage.setItem(STORAGE_KEY, saved);
    coldStart();

    // What the lesson player did on mount, before the shell had hydrated.
    useJourney.getState().goToStep(second.id, 0);
    await useJourney.getState().hydrate();
    vi.advanceTimersByTime(1000);

    // What is on disk is the saved progress (now also listing the lessons the
    // course has, so lessons added in a later version can be pointed out).
    expect({ ...JSON.parse(onDisk() ?? '{}'), seenLessons: null }).toEqual(JSON.parse(saved));
    expect(useJourney.getState().state.profile.name).toBe('Saved learner');
    expect(useJourney.getState().state.lessons[first.id]?.status).toBe('completed');
  });

  it('reads storage once when hydration is requested twice (StrictMode)', async () => {
    window.localStorage.setItem(STORAGE_KEY, encodeState(savedLearner()));
    coldStart();
    const read = vi.spyOn(Storage.prototype, 'getItem');

    await Promise.all([useJourney.getState().hydrate(), useJourney.getState().hydrate()]);
    await useJourney.getState().hydrate();

    expect(read.mock.calls.filter(([key]) => key === STORAGE_KEY)).toHaveLength(1);
    expect(useJourney.getState().hydrated).toBe(true);
  });

  it('does not re-read storage once hydrated, so unsaved changes are not reverted', async () => {
    __setStateForTests(defaultState(1000));
    useJourney.getState().setProfile({ name: 'In memory', onboarded: true });
    window.localStorage.setItem(STORAGE_KEY, encodeState(savedLearner()));

    await useJourney.getState().hydrate();
    expect(useJourney.getState().state.profile.name).toBe('In memory');
  });

  it('saves a finished lesson immediately, without waiting for the debounce', () => {
    __setStateForTests(defaultState(1000));
    useJourney.getState().finishLesson(first.id);
    expect(onDisk()).toContain('"status":"completed"');
  });

  it('saves onboarding, imports and resets immediately', () => {
    __setStateForTests(defaultState(1000));
    useJourney.getState().setProfile({ name: 'Now', onboarded: true });
    expect(onDisk()).toContain('"name":"Now"');

    useJourney.getState().replaceState(JSON.stringify(toEnvelope(savedLearner())));
    expect(onDisk()).toContain('Saved learner');

    useJourney.getState().reset();
    expect(onDisk()).not.toContain(first.id);
  });

  it('flushes queued progress when the page is hidden or closed', () => {
    __setStateForTests(defaultState(1000));
    const stop = startPersistence();

    useJourney.getState().recordResult(first.id, 'read', true, false);
    expect(onDisk()).toBeNull();
    window.dispatchEvent(new Event('pagehide'));
    expect(onDisk()).toContain(first.id);

    useJourney.getState().recordResult(second.id, 'read', true, false);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    expect(onDisk()).toContain(second.id);

    stop();
  });

  it('adopts progress saved by another tab and drops its own older queued write', () => {
    __setStateForTests(defaultState(1000));
    const stop = startPersistence();

    useJourney.getState().recordResult(second.id, 'read', true, false);
    const fromOtherTab = encodeState(savedLearner());
    window.localStorage.setItem(STORAGE_KEY, fromOtherTab);
    window.dispatchEvent(
      new StorageEvent('storage', { key: STORAGE_KEY, newValue: fromOtherTab, storageArea: window.localStorage }),
    );

    expect(useJourney.getState().state.profile.name).toBe('Saved learner');
    vi.advanceTimersByTime(1000);
    expect(onDisk()).toBe(fromOtherTab);
    stop();
  });

  it('flags a save that durable storage refused, and clears the flag after a good save', async () => {
    __setStateForTests(defaultState(1000));
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    useJourney.getState().finishLesson(first.id);
    await vi.waitFor(() => expect(useJourney.getState().saveFailed).toBe(true));

    setItem.mockRestore();
    useJourney.getState().finishLesson(second.id);
    await vi.waitFor(() => expect(useJourney.getState().saveFailed).toBe(false));
  });
});
