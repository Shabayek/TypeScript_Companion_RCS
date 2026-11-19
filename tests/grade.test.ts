import { describe, expect, it } from 'vitest';
import * as grade from '../src/runner/grade';
import { withNotes, type GradeOutcome } from '../src/runner/grade';
import type { TestResult } from '../src/runner/types';
import { inEnglish } from '../src/i18n/messages';

/** Outcomes hold messages, worded when shown; these tests read them in English. */
type English = Omit<GradeOutcome, 'headline' | 'details'> & { headline: string; details: string[] };
const english = (outcome: GradeOutcome): English => ({
  ...outcome,
  headline: inEnglish(outcome.headline),
  details: outcome.details.map(inEnglish),
});
const describeOutcome = (...args: Parameters<typeof grade.describe>) => english(grade.describe(...args));
const compileFailure = (...args: Parameters<typeof grade.compileFailure>) => english(grade.compileFailure(...args));
const runtimeFailure = (...args: Parameters<typeof grade.runtimeFailure>) => english(grade.runtimeFailure(...args));
const timeoutFailure = (...args: Parameters<typeof grade.timeoutFailure>) => english(grade.timeoutFailure(...args));
const unavailable = (...args: Parameters<typeof grade.unavailable>) => english(grade.unavailable(...args));

const pass = (name: string, got: string): TestResult => ({
  name,
  pass: true,
  got,
  expected: got,
});

const fail = (name: string, expected: string, got: string): TestResult => ({
  name,
  pass: false,
  got,
  expected,
});

describe('grading copy', () => {
  it('calls an empty run a pass with no details', () => {
    const outcome = describeOutcome([]);
    expect(outcome).toMatchObject({
      kind: 'pass',
      pass: true,
      headline: 'Ran without errors.',
      details: [],
      results: [],
      logs: [],
    });
  });

  it('celebrates every passing check and echoes its output', () => {
    const outcome = describeOutcome([pass('adds', '5'), pass('names', 'Ada')], 'seed', ['hello']);
    expect(outcome.kind).toBe('pass');
    expect(outcome.pass).toBe(true);
    expect(outcome.details).toHaveLength(2);
    expect(outcome.details[0]).toContain('adds');
    expect(outcome.details[0]).toContain('“5”');
    expect(outcome.details[0]).toContain('✓');
    expect(outcome.logs).toEqual(['hello']);
  });

  it('names only the failing checks, with expected and actual values', () => {
    const outcome = describeOutcome(
      [pass('adds', '5'), fail('doubles', '10', '8')],
      'seed',
      ['one log'],
    );
    expect(outcome.kind).toBe('fail');
    expect(outcome.pass).toBe(false);
    expect(outcome.details).toHaveLength(1);
    expect(outcome.details[0]).toContain('doubles');
    expect(outcome.details[0]).toContain('expected “10”');
    expect(outcome.details[0]).toContain('got “8”');
    expect(outcome.results).toHaveLength(2);
    expect(outcome.logs).toEqual(['one log']);
  });

  it('collapses whitespace so a long value stays readable', () => {
    const outcome = describeOutcome([fail('prints', 'a b', 'a\n\n   b')]);
    expect(outcome.details[0]).toContain('expected “a b”, got “a b”');
  });

  it('is stable for a given seed', () => {
    const first = describeOutcome([pass('x', '1')], 'm03-l02').headline;
    const second = describeOutcome([pass('x', '1')], 'm03-l02').headline;
    expect(first).toBe(second);
  });

  it('explains an unavailable checker without blaming the learner', () => {
    const outcome = unavailable('The compiler did not load.');
    expect(outcome).toMatchObject({ kind: 'unavailable', pass: false, results: [], logs: [] });
    expect(outcome.details[0]).toBe('The compiler did not load.');
    expect(outcome.details[1]).toContain('compare');
  });

  it('adds line numbers to compile problems', () => {
    const outcome = compileFailure([
      { text: 'Expected a semicolon.', line: 4 },
      { text: 'Something else.' },
    ]);
    expect(outcome.kind).toBe('error');
    expect(outcome.details).toEqual(['Expected a semicolon. (line 4)', 'Something else.']);
  });

  it('keeps the logs from a runtime failure', () => {
    const outcome = runtimeFailure('total is not defined', ['before the crash']);
    expect(outcome).toMatchObject({ kind: 'error', pass: false, logs: ['before the crash'] });
    expect(outcome.details[0]).toBe('total is not defined');
  });

  it('turns a timeout into seconds and a next step', () => {
    const outcome = timeoutFailure(2);
    expect(outcome.kind).toBe('timeout');
    expect(outcome.details[0]).toContain('2 seconds');
    expect(outcome.details[1]).toContain('loop');
  });

  it('keeps what a timed-out program printed, and points to it', () => {
    const outcome = timeoutFailure(2, ['count 0', 'count 0']);
    expect(outcome.logs).toEqual(['count 0', 'count 0']);
    expect(outcome.details.at(-1)).toContain('printed before it was stopped');
    expect(timeoutFailure(2).details).toHaveLength(2);
  });

  it('invites a retry when the checker could not start', () => {
    expect(unavailable('x').details[1]).toMatch(/not a problem with your code.*retry/i);
  });

  it('adds run notes after the details, and leaves an outcome without notes alone', () => {
    const outcome = grade.describe([fail('adds', '5', '4')]);
    expect(withNotes(outcome, [])).toBe(outcome);
    expect(english(withNotes(outcome, ['The output was cut off.'])).details).toEqual([
      ...english(outcome).details,
      'The output was cut off.',
    ]);
  });
});
