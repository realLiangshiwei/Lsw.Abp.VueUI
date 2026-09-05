import type { LocalizationParam } from '@lsw-abpvue/core';
import type { AbpValidationError, AbpValidator } from '../models/validation.js';

/**
 * The keys ABP's own validation messages live under. Reused verbatim so a backend that
 * has been translated already translates our client-side messages too.
 */
export const VALIDATION_MESSAGES = {
  required: 'AbpValidation::ThisFieldIsRequired.',
  maxLength: 'AbpValidation::ThisFieldMustBeAStringOrArrayTypeWithAMaximumLengthOf{0}',
  minLength: 'AbpValidation::ThisFieldMustBeAStringOrArrayTypeWithAMinimumLengthOf{0}',
  min: 'AbpValidation::ThisFieldMustBeGreaterThanOrEqual{0}',
  max: 'AbpValidation::ThisFieldMustBeLessOrEqual{0}',
  range: 'AbpValidation::ThisFieldMustBeBetween{0}And{1}',
  pattern: 'AbpValidation::ThisFieldMustMatchTheRegularExpression{0}',
  email: 'AbpValidation::ThisFieldIsNotAValidEmailAddress.',
  url: 'AbpValidation::ThisFieldIsNotAValidFullyQualifiedHttpHttpsOrFtpUrl',
  compare: 'AbpIdentity::Volo.Abp.Identity:PasswordConfirmationFailed',
} as const;

function fail(rule: string, key: LocalizationParam, ...params: unknown[]): AbpValidationError {
  return { rule, key, params };
}

/** Empty is nothing to validate: every rule but `required` passes an empty value. */
function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function lengthOf(value: unknown): number | null {
  if (typeof value === 'string') return value.length;
  if (Array.isArray(value)) return value.length;
  return null;
}

function toNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A value has to be there. `false` counts as a value, the way `[Required]` on a `bool`
 * does on the server.
 * @param message Overrides the default message
 */
export function required<T>(
  message: LocalizationParam = VALIDATION_MESSAGES.required,
): AbpValidator<T> {
  return value => (isEmpty(value) ? fail('required', message) : null);
}

/**
 * At most this many characters, or this many items.
 * @param length The maximum
 * @param message Overrides the default message
 */
export function maxLength<T>(
  length: number,
  message: LocalizationParam = VALIDATION_MESSAGES.maxLength,
): AbpValidator<T> {
  return value => {
    if (isEmpty(value)) return null;
    const actual = lengthOf(value);
    return actual !== null && actual > length ? fail('maxLength', message, length) : null;
  };
}

/**
 * At least this many characters, or this many items.
 * @param length The minimum
 * @param message Overrides the default message
 */
export function minLength<T>(
  length: number,
  message: LocalizationParam = VALIDATION_MESSAGES.minLength,
): AbpValidator<T> {
  return value => {
    if (isEmpty(value)) return null;
    const actual = lengthOf(value);
    return actual !== null && actual < length ? fail('minLength', message, length) : null;
  };
}

/**
 * Not below this number.
 * @param limit The minimum
 * @param message Overrides the default message
 */
export function min<T>(
  limit: number,
  message: LocalizationParam = VALIDATION_MESSAGES.min,
): AbpValidator<T> {
  return value => {
    if (isEmpty(value)) return null;
    const actual = toNumber(value);
    return actual !== null && actual < limit ? fail('min', message, limit) : null;
  };
}

/**
 * Not above this number.
 * @param limit The maximum
 * @param message Overrides the default message
 */
export function max<T>(
  limit: number,
  message: LocalizationParam = VALIDATION_MESSAGES.max,
): AbpValidator<T> {
  return value => {
    if (isEmpty(value)) return null;
    const actual = toNumber(value);
    return actual !== null && actual > limit ? fail('max', message, limit) : null;
  };
}

/**
 * Between two numbers, both ends included -- what `[Range]` maps to.
 * @param lower The minimum
 * @param upper The maximum
 * @param message Overrides the default message
 */
export function range<T>(
  lower: number,
  upper: number,
  message: LocalizationParam = VALIDATION_MESSAGES.range,
): AbpValidator<T> {
  return value => {
    if (isEmpty(value)) return null;
    const actual = toNumber(value);
    if (actual === null) return null;
    return actual < lower || actual > upper ? fail('range', message, lower, upper) : null;
  };
}

/**
 * Matches the expression from end to end, the way `[RegularExpression]` does rather than
 * the way `RegExp.test` does.
 * @param expression The expression the whole value has to match
 * @param message Overrides the default message
 */
export function pattern<T>(
  expression: RegExp,
  message: LocalizationParam = VALIDATION_MESSAGES.pattern,
): AbpValidator<T> {
  const anchored = new RegExp(`^(?:${expression.source})$`, expression.flags.replace('g', ''));

  return value => {
    if (isEmpty(value)) return null;
    return anchored.test(String(value)) ? null : fail('pattern', message, expression.source);
  };
}

/**
 * One `@`, with something on either side -- the same three conditions
 * `EmailAddressAttribute` checks, so the client and the server agree on what an address
 * is.
 * @param message Overrides the default message
 */
export function email<T>(message: LocalizationParam = VALIDATION_MESSAGES.email): AbpValidator<T> {
  return value => {
    if (isEmpty(value)) return null;

    const text = String(value);
    const at = text.indexOf('@');
    const valid = at > 0 && at === text.lastIndexOf('@') && at !== text.length - 1;

    return valid ? null : fail('email', message);
  };
}

/**
 * A fully qualified http, https or ftp URL, as `[Url]` requires.
 * @param message Overrides the default message
 */
export function url<T>(message: LocalizationParam = VALIDATION_MESSAGES.url): AbpValidator<T> {
  const fullyQualified = /^(?:https?|ftp):\/\/[^\s/$.?#][^\s]*$/i;

  return value =>
    isEmpty(value) || fullyQualified.test(String(value)) ? null : fail('url', message);
}

/**
 * The same value as another field. The default message is the one ABP uses for a
 * password confirmation, which is what this is nearly always for.
 * @param other Name of the control to compare against
 * @param message Overrides the default message
 */
export function compare<T>(
  other: string,
  message: LocalizationParam = VALIDATION_MESSAGES.compare,
): AbpValidator<T> {
  return (value, context) => (value === context.valueOf(other) ? null : fail('compare', message));
}

/**
 * The rules under one name, the way Angular's `Validators` groups them, so a form
 * migrated from there reads the same.
 */
export const Validators = {
  required,
  maxLength,
  minLength,
  min,
  max,
  range,
  pattern,
  email,
  url,
  compare,
} as const;
