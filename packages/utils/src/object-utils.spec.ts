import { describe, expect, it } from 'vitest';
import { deepMerge, isPlainObject } from './object-utils.js';

describe('isPlainObject', () => {
  it.each([
    [{}, true],
    [{ a: 1 }, true],
    [Object.create(null), true],
    [[], false],
    [null, false],
    [undefined, false],
    ['text', false],
    [new Date(), false],
    [() => undefined, false],
  ])('%o is a plain object: %s', (value, expected) => {
    expect(isPlainObject(value)).toBe(expected);
  });
});

describe('deepMerge', () => {
  it('merges two objects level by level', () => {
    const merged = deepMerge(
      { application: { name: 'BookStore' }, currentUser: { id: '1' } },
      { application: { name: 'Renamed' } },
    );

    expect(merged).toEqual({ application: { name: 'Renamed' }, currentUser: { id: '1' } });
  });

  it('a defined source wins', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    expect(deepMerge({ a: 1 }, { a: 0 })).toEqual({ a: 0 });
    expect(deepMerge({ a: 1 }, { a: false })).toEqual({ a: false });
  });

  it('a null or undefined source leaves the target alone', () => {
    expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
    expect(deepMerge({ a: 1 }, { a: null })).toEqual({ a: 1 });
    expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  it('gives an empty object when there is neither', () => {
    expect(deepMerge(undefined, undefined)).toEqual({});
    expect(deepMerge(null, null)).toEqual({});
  });

  it('an array is replaced whole rather than merged', () => {
    expect(deepMerge({ langs: ['en', 'tr'] }, { langs: ['de'] })).toEqual({ langs: ['de'] });
  });

  it('anything but a plain object is replaced whole (difference: ABP recurses into instances such as Date)', () => {
    const replacement = new Date('2026-01-01');

    expect(deepMerge({ at: new Date('2025-01-01') }, { at: replacement }).at).toBe(replacement);
  });

  it('leaves the arguments alone', () => {
    const target = { nested: { a: 1 } };
    const source = { nested: { b: 2 } };
    const merged = deepMerge<{ nested: { a?: number; b?: number } }>(target, source);

    expect(target).toEqual({ nested: { a: 1 } });
    expect(source).toEqual({ nested: { b: 2 } });
    expect(merged.nested).not.toBe(target.nested);
  });
});
