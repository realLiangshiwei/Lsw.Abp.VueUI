import { describe, expect, it } from 'vitest';
import type { AbpValidatorContext } from '../models/validation.js';
import {
  compare,
  email,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  range,
  required,
  url,
  VALIDATION_MESSAGES,
} from './validators.js';

const nothing: AbpValidatorContext = { valueOf: () => undefined };

describe('required', () => {
  it('rejects nothing at all', () => {
    expect(required()(null, nothing)).toMatchObject({ rule: 'required' });
    expect(required()(undefined, nothing)).not.toBeNull();
    expect(required()('', nothing)).not.toBeNull();
    expect(required()([], nothing)).not.toBeNull();
  });

  it('accepts false, the way [Required] on a bool does', () => {
    expect(required()(false, nothing)).toBeNull();
    expect(required()(0, nothing)).toBeNull();
  });

  it('carries the localization key ABP uses', () => {
    expect(required()(null, nothing)?.key).toBe(VALIDATION_MESSAGES.required);
  });
});

describe('length rules', () => {
  it('count characters and items alike', () => {
    expect(maxLength(3)('abcd', nothing)).not.toBeNull();
    expect(maxLength(3)(['a', 'b', 'c', 'd'], nothing)).not.toBeNull();
    expect(minLength(2)('a', nothing)).not.toBeNull();
    expect(minLength(2)('ab', nothing)).toBeNull();
  });

  it('pass the limit to the message', () => {
    expect(maxLength(3)('abcd', nothing)?.params).toEqual([3]);
  });
});

describe('number rules', () => {
  it('compare numerically, including numeric strings', () => {
    expect(min(5)(4, nothing)).not.toBeNull();
    expect(min(5)('5', nothing)).toBeNull();
    expect(max(5)(6, nothing)).not.toBeNull();
    expect(range(1, 10)(11, nothing)).not.toBeNull();
    expect(range(1, 10)(10, nothing)).toBeNull();
  });

  it('leave a value that is not a number to the other rules', () => {
    expect(min(5)('abc', nothing)).toBeNull();
  });
});

describe('pattern', () => {
  it('has to match end to end, the way [RegularExpression] does', () => {
    expect(pattern(/[a-z]+/)('abc1', nothing)).not.toBeNull();
    expect(pattern(/[a-z]+/)('abc', nothing)).toBeNull();
  });

  it('keeps an anchored expression working', () => {
    expect(pattern(/^\d{4}$/)('2026', nothing)).toBeNull();
  });
});

describe('email', () => {
  it('applies the three checks EmailAddressAttribute applies', () => {
    expect(email()('someone@example.com', nothing)).toBeNull();
    expect(email()('someone@example', nothing)).toBeNull();
    expect(email()('@example.com', nothing)).not.toBeNull();
    expect(email()('someone@', nothing)).not.toBeNull();
    expect(email()('a@b@c', nothing)).not.toBeNull();
  });
});

describe('url', () => {
  it('wants a fully qualified http, https or ftp url', () => {
    expect(url()('https://abp.io', nothing)).toBeNull();
    expect(url()('ftp://files.abp.io/a', nothing)).toBeNull();
    expect(url()('abp.io', nothing)).not.toBeNull();
    expect(url()('mailto:a@b.com', nothing)).not.toBeNull();
  });
});

describe('compare', () => {
  it('looks the other field up through the context', () => {
    const context: AbpValidatorContext = {
      valueOf: name => (name === 'password' ? '1q2w3E*' : null),
    };

    expect(compare('password')('1q2w3E*', context)).toBeNull();
    expect(compare('password')('something else', context)).toMatchObject({ rule: 'compare' });
  });
});

describe('every rule but required', () => {
  it('passes an empty value, because that is what required is for', () => {
    for (const validate of [
      maxLength(1),
      minLength(5),
      min(1),
      max(1),
      range(1, 2),
      pattern(/a/),
      email(),
      url(),
    ]) {
      expect(validate('', nothing)).toBeNull();
      expect(validate(null, nothing)).toBeNull();
    }
  });
});
