import { describe, expect, it } from 'vitest';
import { deepMerge, isPlainObject } from './object-utils';

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
  ])('%o 是普通对象：%s', (value, expected) => {
    expect(isPlainObject(value)).toBe(expected);
  });
});

describe('deepMerge', () => {
  it('逐层合并两个对象', () => {
    const merged = deepMerge(
      { application: { name: 'BookStore' }, currentUser: { id: '1' } },
      { application: { name: 'Renamed' } },
    );

    expect(merged).toEqual({ application: { name: 'Renamed' }, currentUser: { id: '1' } });
  });

  it('source 有定义就赢', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    expect(deepMerge({ a: 1 }, { a: 0 })).toEqual({ a: 0 });
    expect(deepMerge({ a: 1 }, { a: false })).toEqual({ a: false });
  });

  it('source 是 null 或 undefined 时保留 target', () => {
    expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
    expect(deepMerge({ a: 1 }, { a: null })).toEqual({ a: 1 });
    expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  it('两边都没有时给出空对象', () => {
    expect(deepMerge(undefined, undefined)).toEqual({});
    expect(deepMerge(null, null)).toEqual({});
  });

  it('数组整体替换，不做合并', () => {
    expect(deepMerge({ langs: ['en', 'tr'] }, { langs: ['de'] })).toEqual({ langs: ['de'] });
  });

  it('非普通对象整体替换（差异：ABP 会递归进 Date 这类实例）', () => {
    const replacement = new Date('2026-01-01');

    expect(deepMerge({ at: new Date('2025-01-01') }, { at: replacement }).at).toBe(replacement);
  });

  it('不改动入参', () => {
    const target = { nested: { a: 1 } };
    const source = { nested: { b: 2 } };
    const merged = deepMerge<{ nested: { a?: number; b?: number } }>(target, source);

    expect(target).toEqual({ nested: { a: 1 } });
    expect(source).toEqual({ nested: { b: 2 } });
    expect(merged.nested).not.toBe(target.nested);
  });
});
