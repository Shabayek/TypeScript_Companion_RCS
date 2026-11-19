import { describe, expect, it } from 'vitest';
import {
  loc,
  locList,
  matchesOutput,
  normaliseOutput,
  predictMiss,
  shuffleLines,
} from '../src/content/text';

describe('loc fallback', () => {
  it('prefers the mode variant', () => {
    expect(loc({ base: 'b', story: 's', pro: 'p' }, 'story')).toBe('s');
    expect(loc({ base: 'b', story: 's', pro: 'p' }, 'pro')).toBe('p');
  });

  it('falls back story → explorer → base', () => {
    expect(loc({ base: 'b', explorer: 'e' }, 'story')).toBe('e');
    expect(loc({ base: 'b' }, 'story')).toBe('b');
  });

  it('falls back pro → base without borrowing story voice', () => {
    expect(loc({ base: 'b', story: 's' }, 'pro')).toBe('b');
  });

  it('resolves list variants the same way', () => {
    expect(locList({ base: ['b'], story: ['s'] }, 'story')).toEqual(['s']);
    expect(locList({ base: ['b'] }, 'pro')).toEqual(['b']);
  });
});

describe('output comparison', () => {
  it('normalises line endings, trailing spaces and blank edges', () => {
    expect(normaliseOutput('  a  \r\n\r\nb\t\n')).toBe('a\n\nb');
  });

  it('accepts an exact match after normalising', () => {
    expect(matchesOutput('one\ntwo', 'one\r\ntwo  ')).toBe(true);
  });

  it('accepts listed alternatives, case-insensitively', () => {
    expect(matchesOutput('TRUE', 'true')).toBe(true);
    expect(matchesOutput('yes', 'true', ['yes'])).toBe(true);
  });

  it('rejects a genuinely different answer', () => {
    expect(matchesOutput('one', 'two')).toBe(false);
  });
});

describe('reorder shuffling', () => {
  const lines = ['a', 'b', 'c', 'd'];

  it('is deterministic for a given seed', () => {
    expect(shuffleLines(lines, 'step-1')).toEqual(shuffleLines(lines, 'step-1'));
  });

  it('never hands back the already-correct order', () => {
    for (const seed of ['x', 'y', 'z', 'm03-l01', 'step-9']) {
      expect(shuffleLines(lines, seed)).not.toEqual(lines);
    }
  });

  it('keeps every line exactly once', () => {
    const shuffled = shuffleLines(lines, 'seed');
    expect([...shuffled].sort()).toEqual([...lines].sort());
  });
});

describe('predictMiss', () => {
  it('spots printed quotes', () => {
    expect(predictMiss('"hello"', 'hello')).toBe('quotes');
    expect(predictMiss("'a'\nb", 'a\nb')).toBe('quotes');
  });

  it('spots the right words on the wrong lines', () => {
    expect(predictMiss('Ada 36', 'Ada\n36')).toBe('line-breaks');
    expect(predictMiss('a\nb c', 'a b\nc')).toBe('line-breaks');
  });

  it('spots the right lines in the wrong order', () => {
    expect(predictMiss('two\none', 'one\ntwo')).toBe('order');
  });

  it('spots missing and extra lines', () => {
    expect(predictMiss('one', 'one\ntwo\nthree')).toBe('incomplete');
    expect(predictMiss('one\ntwo\nthree', 'one\ntwo')).toBe('extra');
  });

  it('says nothing specific about a plain wrong answer', () => {
    expect(predictMiss('goodbye', 'hello')).toBeNull();
    expect(predictMiss('', 'hello')).toBeNull();
    expect(predictMiss('"goodbye"', 'hello')).toBeNull();
  });
});
