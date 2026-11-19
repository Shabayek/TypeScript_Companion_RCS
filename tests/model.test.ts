import { describe, expect, it } from 'vitest';
import {
  completeLesson,
  decodeState,
  encodeState,
  fromEnvelope,
  markRevealed,
  migrate,
  recordAttempt,
  resetJourney,
  resumeIndex,
  setStepIndex,
  toEnvelope,
} from '../src/storage/model';
import { SCHEMA_VERSION, defaultState, emptyStep } from '../src/storage/types';

describe('migrate', () => {
  it('returns a fresh state for anything that is not an object', () => {
    const state = migrate('not a state');
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.profile.onboarded).toBe(false);
    expect(state.lessons).toEqual({});
    expect(state.badges).toEqual([]);
  });

  it('keeps good values and repairs the rest', () => {
    const state = migrate({
      profile: { name: 'Ada', onboarded: true },
      settings: {
        mode: 'story',
        textSize: 9,
        font: 'comic',
        theme: 'neon',
        readAloud: 'yes',
      },
      lessons: {
        'm00-l01-code-is-instructions': {
          status: 'completed',
          stepIndex: -4,
          timeMs: -5,
          steps: { read: { solved: true, attempts: 2 } },
        },
        broken: 'not an object',
      },
      badges: ['first-steps', 3],
      unknownKey: 'dropped',
    });

    expect(state.profile.name).toBe('Ada');
    expect(state.profile.onboarded).toBe(true);
    expect(state.settings.mode).toBe('story');
    expect(state.settings.textSize).toBe(5);
    expect(state.settings.font).toBe('standard');
    expect(state.settings.theme).toBe('auto');
    expect(state.settings.readAloud).toBe(false);
    expect(Object.keys(state.lessons)).toEqual(['m00-l01-code-is-instructions']);
    expect(state.lessons['m00-l01-code-is-instructions']).toMatchObject({
      status: 'completed',
      stepIndex: 0,
      timeMs: 0,
      steps: { read: { solved: true, practiced: false, attempts: 2, revealed: false } },
    });
    expect(state.badges).toEqual(['first-steps']);
    expect('unknownKey' in state).toBe(false);
  });

  it('rounds text size into the supported range', () => {
    expect(migrate({ settings: { textSize: 0 } }).settings.textSize).toBe(1);
    expect(migrate({ settings: { textSize: 4.6 } }).settings.textSize).toBe(5);
    expect(migrate({ settings: { textSize: 'large' } }).settings.textSize).toBe(3);
  });

  it('does not invent a completion date', () => {
    const state = migrate({
      lessons: { a: { status: 'started', steps: {}, stepIndex: 0, timeMs: 0 } },
    });
    expect(state.lessons.a && 'completedAt' in state.lessons.a).toBe(false);
  });
});

describe('state encoding', () => {
  it('round-trips through JSON', () => {
    const state = defaultState(1000);
    state.profile.name = 'Grace';
    state.badges.push('first-steps');
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it('falls back to a fresh state when the text is missing or corrupt', () => {
    expect(decodeState(null).profile.onboarded).toBe(false);
    expect(decodeState('{oops').lessons).toEqual({});
  });

  it('wraps a state in an export envelope and unwraps either shape', () => {
    const state = defaultState(42);
    state.profile.name = 'Lin';
    const exported = toEnvelope(state, new Date('2024-03-01T12:00:00.000Z'));
    expect(exported.app).toBe('typescript-companion');
    expect(exported.exportedAt).toBe('2024-03-01T12:00:00.000Z');

    expect(fromEnvelope(JSON.stringify(exported)).profile.name).toBe('Lin');
    expect(fromEnvelope(JSON.stringify(state)).profile.name).toBe('Lin');
  });
});

describe('progress transitions', () => {
  it('records a correct attempt as solved, and keeps the lesson started', () => {
    const state = recordAttempt(defaultState(1), 'lesson', 'step', {
      correct: true,
      revealed: false,
    });
    expect(state.lessons.lesson?.status).toBe('started');
    expect(state.lessons.lesson?.steps.step).toEqual({
      solved: true,
      practiced: false,
      attempts: 1,
      revealed: false,
    });
  });

  it('records a revealed answer as practised, never solved', () => {
    const state = recordAttempt(defaultState(1), 'lesson', 'step', {
      correct: true,
      revealed: true,
    });
    expect(state.lessons.lesson?.steps.step).toMatchObject({
      solved: false,
      practiced: true,
      revealed: true,
    });
  });

  it('counts every attempt and never un-solves a step', () => {
    let state = recordAttempt(defaultState(1), 'lesson', 'step', {
      correct: true,
      revealed: false,
    });
    state = recordAttempt(state, 'lesson', 'step', { correct: false, revealed: false });
    expect(state.lessons.lesson?.steps.step).toMatchObject({ solved: true, attempts: 2 });
  });

  it('keeps a completed lesson completed after more practice', () => {
    let state = completeLesson(defaultState(1), 'lesson', 1000, ['first-steps']);
    state = recordAttempt(state, 'lesson', 'step', { correct: false, revealed: false });
    expect(state.lessons.lesson?.status).toBe('completed');
  });

  it('marks a step as revealed without touching its attempts', () => {
    const state = markRevealed(defaultState(1), 'lesson', 'step');
    expect(state.lessons.lesson?.steps.step).toEqual({
      ...emptyStep(),
      revealed: true,
    });
  });

  it('remembers the open lesson and clamps the step index', () => {
    const state = setStepIndex(defaultState(1), 'lesson', -2);
    expect(state.lastLessonId).toBe('lesson');
    expect(state.lessons.lesson?.stepIndex).toBe(0);
    expect(setStepIndex(state, 'lesson', 3).lessons.lesson?.stepIndex).toBe(3);
  });

  it('completes a lesson, accumulates time, and de-duplicates badges', () => {
    let state = completeLesson(defaultState(1), 'lesson', 90_000, ['first-steps', 'module:m00']);
    state = completeLesson(state, 'lesson', 30_000, ['first-steps']);
    const progress = state.lessons.lesson;
    expect(progress?.status).toBe('completed');
    expect(progress?.stepIndex).toBe(0);
    expect(progress?.timeMs).toBe(120_000);
    expect(typeof progress?.completedAt).toBe('number');
    expect(state.totalTimeMs).toBe(120_000);
    expect(state.badges).toEqual(['first-steps', 'module:m00']);
    expect(state.lastLessonId).toBe('lesson');
  });

  it('ignores negative time', () => {
    const state = completeLesson(defaultState(1), 'lesson', -500, []);
    expect(state.totalTimeMs).toBe(0);
    expect(state.lessons.lesson?.timeMs).toBe(0);
  });

  it('resets progress while keeping the person, settings and studio intact', () => {
    const start = defaultState(1234);
    start.profile.onboarded = true;
    start.settings.theme = 'dark';
    start.settings.mode = 'pro';
    start.badges.push('first-steps');
    start.lessons.lesson = {
      status: 'completed',
      stepIndex: 0,
      steps: {},
      timeMs: 500,
    };
    start.totalTimeMs = 500;
    start.lastLessonId = 'lesson';

    const state = resetJourney(start);
    expect(state.profile.createdAt).toBe(1234);
    expect(state.profile.onboarded).toBe(true);
    expect(state.settings).toEqual(start.settings);
    expect(state.lessons).toEqual({});
    expect(state.badges).toEqual([]);
    expect(state.totalTimeMs).toBe(0);
    expect(state.lastLessonId).toBeNull();
  });
});

describe('migrate hardening against imported or stored data', () => {
  const lessonId = 'm00-l01-code-is-instructions';

  it('turns a fractional, negative or infinite step index into a whole number', () => {
    // Raw JSON on purpose: `1e400` only becomes Infinity when parsed.
    const fromJson = (stepIndex: string) =>
      fromEnvelope(`{"lessons":{"${lessonId}":{"status":"started","stepIndex":${stepIndex}}}}`)
        .lessons[lessonId]?.stepIndex;

    expect(fromJson('1.5')).toBe(1);
    expect(fromJson('-3')).toBe(0);
    expect(fromJson('1e400')).toBe(0);
  });

  it('never lets a "__proto__" key replace the prototype of lessons or steps', () => {
    const state = fromEnvelope(
      `{"profile":{"onboarded":true},"lessons":{"__proto__":{"status":"completed"},` +
        `"constructor":{"status":"completed"},"${lessonId}":{"status":"started",` +
        `"steps":{"__proto__":{"solved":true},"read":{"solved":true}}}}}`,
    );

    expect(Object.getPrototypeOf(state.lessons)).toBe(Object.prototype);
    expect(Object.keys(state.lessons)).toEqual([lessonId]);
    // Before the fix every unknown lesson read as completed through the prototype.
    expect(state.lessons['m00-l02-why-typescript']?.status).toBeUndefined();
    const steps = state.lessons[lessonId]?.steps ?? {};
    expect(Object.getPrototypeOf(steps)).toBe(Object.prototype);
    expect(Object.keys(steps)).toEqual(['read']);
  });

  it('repairs counters and times that cannot be displayed', () => {
    const state = fromEnvelope(
      `{"lessons":{"${lessonId}":{"timeMs":1e400,"completedAt":-1,` +
        `"steps":{"read":{"attempts":-5}}}},"totalTimeMs":1e400,` +
        `"profile":{"createdAt":1e400}}`,
    );

    const lesson = state.lessons[lessonId];
    expect(lesson?.steps.read?.attempts).toBe(0);
    expect(lesson?.timeMs).toBe(0);
    expect(lesson && 'completedAt' in lesson).toBe(false);
    expect(state.totalTimeMs).toBe(0);
    expect(Number.isFinite(state.profile.createdAt)).toBe(true);
  });

  it('de-duplicates badges', () => {
    expect(migrate({ badges: ['first-steps', 'first-steps', 'module:m00'] }).badges).toEqual([
      'first-steps',
      'module:m00',
    ]);
  });

  it('stores whole step indexes only', () => {
    expect(setStepIndex(defaultState(1), lessonId, 2.7).lessons[lessonId]?.stepIndex).toBe(2);
  });
});

describe('resumeIndex', () => {
  it('resumes an unfinished lesson at the saved step', () => {
    expect(resumeIndex({ status: 'started', stepIndex: 3 }, 5)).toBe(3);
  });

  it('starts a finished or unknown lesson from the beginning', () => {
    expect(resumeIndex({ status: 'completed', stepIndex: 3 }, 5)).toBe(0);
    expect(resumeIndex(undefined, 5)).toBe(0);
  });

  it('always returns an index that exists', () => {
    expect(resumeIndex({ status: 'started', stepIndex: 99 }, 5)).toBe(4);
    expect(resumeIndex({ status: 'started', stepIndex: 1.5 }, 5)).toBe(1);
    expect(resumeIndex({ status: 'started', stepIndex: Number.POSITIVE_INFINITY }, 5)).toBe(0);
    expect(resumeIndex({ status: 'started', stepIndex: -2 }, 5)).toBe(0);
    expect(resumeIndex({ status: 'started', stepIndex: 2 }, 0)).toBe(0);
  });
});
