import {
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import {
  getPasswordValidators,
  passwordRulesOf,
  passwordValidators,
  type PasswordRules,
} from './password-validators.js';

const NOTHING_REQUIRED: PasswordRules = {
  requiredLength: 1,
  requiredUniqueChars: 1,
  requireDigit: false,
  requireLowercase: false,
  requireUppercase: false,
  requireNonAlphanumeric: false,
};

const context = { valueOf: () => undefined };

function rulesFailedBy(rules: PasswordRules, value: string): string[] {
  return passwordValidators(rules)
    .map(validate => validate(value, context))
    .filter(error => error !== null)
    .map(error => error.rule);
}

function injectorWithSettings(values: Record<string, string>): Injector {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    setting: { values },
  } as ApplicationConfigurationDto);

  return injector;
}

describe('passwordValidators', () => {
  it('accepts a password that meets every rule', () => {
    const rules: PasswordRules = {
      requiredLength: 6,
      requiredUniqueChars: 3,
      requireDigit: true,
      requireLowercase: true,
      requireUppercase: true,
      requireNonAlphanumeric: true,
    };

    expect(rulesFailedBy(rules, '1q2w3E*')).toEqual([]);
  });

  it('names every rule the password breaks, not just the first', () => {
    const rules: PasswordRules = {
      requiredLength: 8,
      requiredUniqueChars: 1,
      requireDigit: true,
      requireLowercase: true,
      requireUppercase: true,
      requireNonAlphanumeric: true,
    };

    expect(rulesFailedBy(rules, 'abc')).toEqual([
      'digit',
      'uppercase',
      'nonAlphanumeric',
      'tooShort',
    ]);
  });

  it('leaves an empty value to the required validator', () => {
    const rules: PasswordRules = { ...NOTHING_REQUIRED, requiredLength: 8, requireDigit: true };

    expect(rulesFailedBy(rules, '')).toEqual([]);
  });

  it('counts an accented letter as the letter it is built from', () => {
    const lower: PasswordRules = { ...NOTHING_REQUIRED, requireLowercase: true };
    const upper: PasswordRules = { ...NOTHING_REQUIRED, requireUppercase: true };

    expect(rulesFailedBy(lower, 'é')).toEqual([]);
    expect(rulesFailedBy(upper, 'É')).toEqual([]);
    expect(rulesFailedBy(upper, 'é')).toEqual(['uppercase']);
  });

  it('reports the required length as a message parameter', () => {
    const [tooShort] = passwordValidators({ ...NOTHING_REQUIRED, requiredLength: 12 });

    expect(tooShort?.('short', context)).toMatchObject({ rule: 'tooShort', params: [12] });
  });

  it('counts distinct characters when the policy asks for them', () => {
    const rules: PasswordRules = { ...NOTHING_REQUIRED, requiredUniqueChars: 4 };

    expect(rulesFailedBy(rules, 'aaab')).toEqual(['uniqueChars']);
    expect(rulesFailedBy(rules, 'abcd')).toEqual([]);
  });

  it('has no unique character validator when one is enough', () => {
    expect(rulesFailedBy({ ...NOTHING_REQUIRED, requiredUniqueChars: 1 }, 'aaaa')).toEqual([]);
  });

  it('refuses a password longer than the one ABP takes', () => {
    expect(rulesFailedBy(NOTHING_REQUIRED, 'a'.repeat(129))).toEqual(['maxLength']);
  });
});

describe('passwordRulesOf', () => {
  it('reads the policy out of the settings', () => {
    const injector = injectorWithSettings({
      'Abp.Identity.Password.RequiredLength': '10',
      'Abp.Identity.Password.RequiredUniqueChars': '4',
      'Abp.Identity.Password.RequireDigit': 'False',
      'Abp.Identity.Password.RequireLowercase': 'True',
      'Abp.Identity.Password.RequireUppercase': 'false',
      'Abp.Identity.Password.RequireNonAlphanumeric': 'true',
    });

    expect(passwordRulesOf(injector.get(ConfigStateService))).toEqual({
      requiredLength: 10,
      requiredUniqueChars: 4,
      requireDigit: false,
      requireLowercase: true,
      requireUppercase: false,
      requireNonAlphanumeric: true,
    });
  });

  it("falls back to ABP's own defaults when the backend said nothing", () => {
    const injector = createInjector([]);

    expect(passwordRulesOf(injector.get(ConfigStateService))).toEqual({
      requiredLength: 6,
      requiredUniqueChars: 1,
      requireDigit: true,
      requireLowercase: true,
      requireUppercase: true,
      requireNonAlphanumeric: true,
    });
  });

  it('ignores a length that is not a positive whole number', () => {
    const injector = injectorWithSettings({ 'Abp.Identity.Password.RequiredLength': 'six' });

    expect(passwordRulesOf(injector.get(ConfigStateService)).requiredLength).toBe(6);
  });
});

describe('getPasswordValidators', () => {
  it('builds the validators of the policy the injector can reach', () => {
    const injector = injectorWithSettings({
      'Abp.Identity.Password.RequireDigit': 'false',
      'Abp.Identity.Password.RequireLowercase': 'false',
      'Abp.Identity.Password.RequireUppercase': 'false',
      'Abp.Identity.Password.RequireNonAlphanumeric': 'false',
      'Abp.Identity.Password.RequiredLength': '4',
    });

    const validators = getPasswordValidators(injector.get.bind(injector));

    expect(validators.map(validate => validate('abc', context)?.rule)).toEqual([
      'tooShort',
      undefined,
    ]);
  });
});
