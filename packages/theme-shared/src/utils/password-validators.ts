import { ConfigStateService, inject, type Injector } from '@lsw-abpvue/core';
import type { AbpValidator } from '../models/validation.js';
import { maxLength } from './validators.js';

/**
 * The keys ABP's Identity module rejects a password under. Reusing them means the
 * message a user reads before submitting is the one the server would have answered with.
 */
export const PASSWORD_MESSAGES = {
  digit: 'AbpIdentity::Volo.Abp.Identity:PasswordRequiresDigit',
  lowercase: 'AbpIdentity::Volo.Abp.Identity:PasswordRequiresLower',
  uppercase: 'AbpIdentity::Volo.Abp.Identity:PasswordRequiresUpper',
  nonAlphanumeric: 'AbpIdentity::Volo.Abp.Identity:PasswordRequiresNonAlphanumeric',
  tooShort: 'AbpIdentity::Volo.Abp.Identity:PasswordTooShort',
  uniqueChars: 'AbpIdentity::Volo.Abp.Identity:PasswordRequiresUniqueChars',
} as const;

/** What `Abp.Identity.Password.*` says a password has to be. */
export interface PasswordRules {
  requiredLength: number;
  requiredUniqueChars: number;
  requireDigit: boolean;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireNonAlphanumeric: boolean;
}

/** ABP's own defaults, for a backend that has not been asked yet. */
const DEFAULTS: PasswordRules = {
  requiredLength: 6,
  requiredUniqueChars: 1,
  requireDigit: true,
  requireLowercase: true,
  requireUppercase: true,
  requireNonAlphanumeric: true,
};

/** The longest password ABP's own forms accept. */
const MAX_LENGTH = 128;

const CHARACTER_CLASSES = {
  digit: /[0-9]/,
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  nonAlphanumeric: /[^0-9a-zA-Z]/,
} as const;

/**
 * `é` is a lowercase letter to `char.IsLower` and not to `[a-z]`, so the accents come
 * off before the classes are tested and the two sides agree on what a password contains.
 */
function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * The password policy of the tenant that is signed in, read from the settings the
 * application configuration already carries.
 * @param configState Where the settings are
 */
export function passwordRulesOf(configState: ConfigStateService): PasswordRules {
  const settings = configState.getSettings('Identity.Password').value;
  const read = (name: string) => settings[`Abp.Identity.Password.${name}`];

  return {
    requiredLength: toNumber(read('RequiredLength'), DEFAULTS.requiredLength),
    requiredUniqueChars: toNumber(read('RequiredUniqueChars'), DEFAULTS.requiredUniqueChars),
    requireDigit: toBoolean(read('RequireDigit'), DEFAULTS.requireDigit),
    requireLowercase: toBoolean(read('RequireLowercase'), DEFAULTS.requireLowercase),
    requireUppercase: toBoolean(read('RequireUppercase'), DEFAULTS.requireUppercase),
    requireNonAlphanumeric: toBoolean(
      read('RequireNonAlphanumeric'),
      DEFAULTS.requireNonAlphanumeric,
    ),
  };
}

/**
 * Turns a policy into validators. Empty passes everything: whether a password is
 * required at all is the form's decision, not the policy's.
 * @param rules What the password has to be
 */
export function passwordValidators(rules: PasswordRules): AbpValidator[] {
  const validators: AbpValidator[] = [];

  // A control's value is whatever it holds; only a string can break a password rule.
  const text = (value: unknown) => (typeof value === 'string' ? value : '');

  const contains = (name: keyof typeof CHARACTER_CLASSES): AbpValidator => {
    const expression = CHARACTER_CLASSES[name];

    return value =>
      !text(value) || expression.test(fold(text(value)))
        ? null
        : { rule: name, key: PASSWORD_MESSAGES[name], params: [] };
  };

  if (rules.requireDigit) validators.push(contains('digit'));
  if (rules.requireLowercase) validators.push(contains('lowercase'));
  if (rules.requireUppercase) validators.push(contains('uppercase'));
  if (rules.requireNonAlphanumeric) validators.push(contains('nonAlphanumeric'));

  validators.push(value =>
    !text(value) || text(value).length >= rules.requiredLength
      ? null
      : { rule: 'tooShort', key: PASSWORD_MESSAGES.tooShort, params: [rules.requiredLength] },
  );

  if (rules.requiredUniqueChars > 1) {
    validators.push(value =>
      !text(value) || new Set(text(value)).size >= rules.requiredUniqueChars
        ? null
        : {
            rule: 'uniqueChars',
            key: PASSWORD_MESSAGES.uniqueChars,
            params: [rules.requiredUniqueChars],
          },
    );
  }

  validators.push(maxLength(MAX_LENGTH));

  return validators;
}

/**
 * The validators of the current password policy, for a form field that takes a password.
 * @param get Reaches `ConfigStateService`; a prop callback's `getInjected`
 * @see Angular's `getPasswordValidators` in `@abp/ng.theme.shared`
 */
export function getPasswordValidators(get: Injector['get']): AbpValidator[] {
  return passwordValidators(passwordRulesOf(get(ConfigStateService)));
}

/** The same list, for a component that is inside an injection context of its own. */
export function usePasswordValidators(): AbpValidator[] {
  return passwordValidators(passwordRulesOf(inject(ConfigStateService)));
}
