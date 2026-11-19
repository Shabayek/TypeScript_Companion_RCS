import { describe, expect, it } from 'vitest';
import { DECODER, decodeError } from '../src/content/decoder';

describe('error decoder', () => {
  it('has usable, uniquely named entries', () => {
    const ids = new Set<string>();
    for (const entry of DECODER) {
      expect(entry.id.trim()).not.toBe('');
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(entry.match).toBe(entry.match.toLowerCase());
      expect(entry.match.trim()).not.toBe('');
      expect(entry.title.trim()).not.toBe('');
      expect(entry.plain.trim()).not.toBe('');
      expect(entry.fix.trim()).not.toBe('');
    }
  });

  it('recognises a missing name', () => {
    expect(decodeError("error TS2304: Cannot find name 'total'.")?.id).toBe('cannot-find-name');
  });

  it('recognises an ordinary type mismatch, and an argument of the wrong type', () => {
    expect(decodeError("Type 'number' is not assignable to type 'string'.")?.id).toBe('not-assignable');
    expect(
      decodeError("Argument of type 'number' is not assignable to parameter of type 'string'.")
        ?.id,
    ).toBe('argument-type');
  });

  it('prefers the specific null and never explanations', () => {
    expect(decodeError("Type 'null' is not assignable to type 'string'.")?.id).toBe('null-assign');
    expect(decodeError("Type '\"done\"' is not assignable to type 'never'.")?.id).toBe('never');
  });

  it('recognises a possible undefined', () => {
    expect(decodeError("Object is possibly 'undefined'.")?.id).toBe('possibly-undefined');
  });

  it('recognises a property that does not exist', () => {
    expect(decodeError("Property 'length' does not exist on type 'number'.")?.id).toBe(
      'does-not-exist-on-type',
    );
  });

  it('recognises a runtime read of nothing', () => {
    expect(
      decodeError("TypeError: Cannot read properties of undefined (reading 'name')")?.id,
    ).toBe('undefined-reading');
  });

  it('recognises a stray token before the generic argument message', () => {
    expect(decodeError("Unexpected token '}'")?.id).toBe('unexpected-token');
  });

  it('recognises a wrong argument count', () => {
    expect(decodeError('Expected 2 arguments, but got 1.')?.id).toBe('expected-arguments');
  });

  it('recognises a missing semicolon', () => {
    expect(decodeError("error TS1005: ';' expected.")?.id).toBe('expected-semicolon');
  });

  it('recognises an unclosed string and a runaway function', () => {
    expect(decodeError('Unterminated string literal.')?.id).toBe('unterminated-string');
    expect(decodeError('RangeError: Maximum call stack size exceeded')?.id).toBe('stack-size');
  });

  it('is case-insensitive', () => {
    expect(decodeError('CANNOT FIND NAME')?.id).toBe('cannot-find-name');
  });

  it('returns nothing for an error it does not know', () => {
    expect(decodeError('Everything is fine')).toBeUndefined();
    expect(decodeError('')).toBeUndefined();
  });
});

describe('error decoder: syntax errors are not argument-count errors', () => {
  it('explains the in-app compiler’s "Expected … but found …" errors', () => {
    expect(decodeError('Expected ";" but found "b"')?.id).toBe('expected-but-found');
    expect(decodeError('Expected "}" but found end of file')?.id).toBe('expected-but-found');
    expect(decodeError('Expected identifier but found "="')?.id).toBe('expected-but-found');
  });

  it('explains TypeScript’s "… expected." syntax errors', () => {
    expect(decodeError('error TS1128: Declaration or statement expected.')?.id).toBe('syntax-expected');
    expect(decodeError('error TS1109: Expression expected.')?.id).toBe('syntax-expected');
    expect(decodeError('error TS1003: Identifier expected.')?.id).toBe('syntax-expected');
  });

  it('keeps the argument-count entry for argument-count messages, in all their forms', () => {
    expect(decodeError('Expected 2 arguments, but got 1.')?.id).toBe('expected-arguments');
    expect(decodeError('Expected at least 1 arguments, but got 0.')?.id).toBe('expected-arguments');
    expect(decodeError('Expected 1-2 arguments, but got 3.')?.id).toBe('expected-arguments');
  });
});
