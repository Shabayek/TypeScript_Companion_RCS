import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { readImport, toEnvelope } from '../src/storage/model';
import { __setStateForTests, summarize, useJourney } from '../src/storage/store';
import { IMPORT_BACKUP_KEY, STORAGE_KEY, defaultState, type ProgressState } from '../src/storage/types';
import { inEnglish } from '../src/i18n/messages';

function lessonId(index: number): string {
  const lesson = ALL_LESSONS[index];
  if (!lesson) throw new Error('missing lesson');
  return lesson.id;
}

/** An onboarded learner with `finished` completed lessons, the last finished at `lastAt`. */
function learner(finished: number, lastAt = 1_000, name = 'Ada'): ProgressState {
  const state = defaultState(1);
  state.profile = { name, onboarded: true, createdAt: 1, experience: null };
  for (let i = 0; i < finished; i += 1) {
    state.lessons[lessonId(i)] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1, completedAt: lastAt - (finished - 1 - i) };
  }
  state.badges = finished > 0 ? ['first-steps'] : [];
  return state;
}

const exported = (state: ProgressState, at = '2026-05-03T10:00:00.000Z') => JSON.stringify(toEnvelope(state, new Date(at)));

describe('reading a progress file', () => {
  it('reads the export date when the file has one', () => {
    expect(readImport(exported(learner(1))).exportedAt).toBe(Date.parse('2026-05-03T10:00:00.000Z'));
    expect(readImport(JSON.stringify(learner(1))).exportedAt).toBeNull();
  });

  it('summarises what a state holds', () => {
    expect(summarize(learner(3, 5_000))).toMatchObject({ name: 'Ada', lessonsCompleted: 3, badges: 1, lastFinishedAt: 5_000 });
    expect(summarize(learner(0)).lastFinishedAt).toBeNull();
  });
});

describe('import preview, confirmation and undo (R2)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('previews a file without changing anything', () => {
    __setStateForTests(learner(2));
    const before = useJourney.getState().state;

    const preview = useJourney.getState().previewImport(exported(learner(5, 9_000, 'Sam')));

    expect(preview).toMatchObject({
      ok: true,
      incoming: { name: 'Sam', lessonsCompleted: 5 },
      current: { name: 'Ada', lessonsCompleted: 2 },
      exportedAt: Date.parse('2026-05-03T10:00:00.000Z'),
      warning: null,
    });
    expect(useJourney.getState().state).toBe(before);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('warns when the file has less progress than this device', () => {
    __setStateForTests(learner(4));
    const preview = useJourney.getState().previewImport(exported(learner(1)));
    expect(preview.ok && preview.warning ? inEnglish(preview.warning) : '').toContain('less progress than this device (1 finished lesson instead of 4)');
  });

  it('warns when the file is older, even with the same number of lessons', () => {
    __setStateForTests(learner(2, 9_000));
    const preview = useJourney.getState().previewImport(exported(learner(2, 5_000)));
    expect(preview.ok && preview.warning ? inEnglish(preview.warning) : '').toMatch(/looks older/);
  });

  it('refuses files that are not progress, before anything happens', () => {
    __setStateForTests(learner(1));
    expect(useJourney.getState().previewImport('not json')).toMatchObject({ ok: false });
    expect(useJourney.getState().previewImport(exported(defaultState(1)))).toMatchObject({ ok: false });
  });

  it('keeps the replaced progress, and undo puts it back', () => {
    __setStateForTests(learner(4, 9_000));

    expect(useJourney.getState().replaceState(exported(learner(1, 1_000, 'Old')))).toMatchObject({ ok: true });
    expect(useJourney.getState().state.profile.name).toBe('Old');
    expect(useJourney.getState().importBackup).not.toBeNull();
    expect(window.localStorage.getItem(IMPORT_BACKUP_KEY)).toContain('"name":"Ada"');

    expect(useJourney.getState().undoImport()).toMatchObject({ ok: true });
    expect(useJourney.getState().state.profile.name).toBe('Ada');
    expect(summarize(useJourney.getState().state).lessonsCompleted).toBe(4);
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"name":"Ada"');
    expect(useJourney.getState().importBackup).toBeNull();
    expect(window.localStorage.getItem(IMPORT_BACKUP_KEY)).toBeNull();
    expect(useJourney.getState().undoImport()).toMatchObject({ ok: false });
  });

  it('can still undo after the app is restarted', async () => {
    __setStateForTests(learner(4));
    useJourney.getState().replaceState(exported(learner(1, 1_000, 'Old')));

    // A fresh start: the store reads storage again.
    useJourney.setState({ hydrated: false, importBackup: null });
    await useJourney.getState().hydrate();

    expect(useJourney.getState().importBackup).not.toBeNull();
    useJourney.getState().undoImport();
    expect(useJourney.getState().state.profile.name).toBe('Ada');
  });
});
