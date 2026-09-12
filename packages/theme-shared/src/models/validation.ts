import type { LocalizationParam } from '@lsw-abpvue/core';

/**
 * One thing wrong with one value. The message is a localization key rather than text so
 * the error survives a language change; a message the server already localized passes
 * through the localizer unchanged, which is what a key without `::` does.
 */
export interface AbpValidationError {
  /** Which rule failed: `required`, `maxLength`, `server`. */
  rule: string;
  key: LocalizationParam;
  params: unknown[];
}

/** What a validator can see besides the value it is given. */
export interface AbpValidatorContext {
  /**
   * Another field's value, for rules that compare two of them.
   * @param name Name of the other control
   */
  valueOf(name: string): unknown;
}

export type AbpValidator<T = unknown> = (
  value: T,
  context: AbpValidatorContext,
) => AbpValidationError | null;

/**
 * The validators of a form, keyed by control name. What `abpvue proxy add` generates
 * from what the backend already declares, and what a hand-written form spreads into its
 * controls.
 */
export type ValidatorMap<T = Record<string, unknown>> = {
  [K in keyof T & string]?: AbpValidator[];
};

/** One entry of ABP's `validationErrors`; its message is already localized. */
export interface AbpServerValidationError {
  message: string;
  members?: string[] | undefined;
}
