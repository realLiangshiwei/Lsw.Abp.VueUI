import { describe, expect, it } from 'vitest';
import { interpolate } from './string-utils.js';

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
  ])('interpolates %s', (text, params, expected) => {
    expect(interpolate(text, params)).toBe(expected);
  });

  it.each([
    ['This is {0} and {1} example.', ['foo'], 'This is foo and {1} example.'],
    ['This is {0} and {1} example.', [], 'This is {0} and {1} example.'],
    ['This is {0} example.', [null], 'This is {0} example.'],
    ["This is '{0}' example.", [], "This is '{0}' example."],
    ['This is { 0 } example.', [], 'This is {0} example.'],
  ])('keeps the placeholder when the parameter is missing: %s', (text, params, expected) => {
    expect(interpolate(text, params)).toBe(expected);
  });

  it('does not collapse whitespace (difference D+, Angular squeezes it to one space)', () => {
    expect(interpolate('line {0}\n\nline two', ['one'])).toBe('line one\n\nline two');
    expect(interpolate('two  spaces', [])).toBe('two  spaces');
  });
});
