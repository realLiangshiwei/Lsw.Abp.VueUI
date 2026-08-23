import { describe, expect, it } from 'vitest';
import { interpolate } from './string-utils';

describe('interpolate', () => {
  it.each([
    ['This is {0} and {1} example.', ['foo', 'bar'], 'This is foo and bar example.'],
    ['This is {1} and {0} example.', ['foo', 'bar'], 'This is bar and foo example.'],
    ['This is {0} and {0} example.', ['foo', 'bar'], 'This is foo and foo example.'],
    ['This is "{0}" and "{1}" example.', ['foo', 'bar'], 'This is "foo" and "bar" example.'],
    ["This is '{1}' and '{0}' example.", ['foo', 'bar'], "This is 'bar' and 'foo' example."],
    ['This is { 0 } and {0} example.', ['foo', 'bar'], 'This is foo and foo example.'],
    ['This is {1} and {  1  } example.', ['foo', 'bar'], 'This is bar and bar example.'],
    ['This is {0} with 0 example.', ['foo'], 'This is foo with 0 example.'],
  ])('替换 %s', (text, params, expected) => {
    expect(interpolate(text, params)).toBe(expected);
  });

  it.each([
    ['This is {0} and {1} example.', ['foo'], 'This is foo and {1} example.'],
    ['This is {0} and {1} example.', [], 'This is {0} and {1} example.'],
    ['This is {0} example.', [null], 'This is {0} example.'],
    ["This is '{0}' example.", [], "This is '{0}' example."],
    ['This is { 0 } example.', [], 'This is {0} example.'],
  ])('参数缺失时保留占位符：%s', (text, params, expected) => {
    expect(interpolate(text, params)).toBe(expected);
  });

  it('不折叠空白（差异 Δ+，Angular 会把所有空白压成一个空格）', () => {
    expect(interpolate('line {0}\n\nline two', ['one'])).toBe('line one\n\nline two');
    expect(interpolate('two  spaces', [])).toBe('two  spaces');
  });
});
