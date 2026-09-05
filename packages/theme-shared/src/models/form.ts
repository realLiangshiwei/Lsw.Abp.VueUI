import type { AbpServerValidationError, AbpValidationError, AbpValidator } from './validation.js';

export interface AbpFormControl<T = unknown> {
  readonly name: string;
  /**
   * The value, readable and writable: `v-model="form.controls.userName.value"`. Writing
   * marks the control dirty and drops whatever the server said about the old value.
   */
  value: T;
  readonly errors: readonly AbpValidationError[];
  readonly valid: boolean;
  readonly invalid: boolean;
  /** True once the value has been written through `value`. `patch` does not set it. */
  readonly dirty: boolean;
  /** True once the control has been left, which is when errors are usually shown. */
  readonly touched: boolean;
  disabled: boolean;
  readonly: boolean;
  markAsTouched(): void;
  markAsDirty(): void;
  /** Sets the value without marking it dirty, for filling a form from a record. */
  patch(value: T): void;
  /**
   * Back to the initial value, with the flags and the server's errors cleared.
   * @param value Becomes the new initial value
   */
  reset(value?: T): void;
  /** @param messages Localized messages from the server */
  setServerErrors(messages: readonly string[]): void;
  clearServerErrors(): void;
}

export interface AbpFormFieldDefinition<T> {
  value: T;
  validators?: readonly AbpValidator<T>[] | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
}

export type AbpFormDefinition<TValue extends Record<string, unknown>> = {
  [K in keyof TValue]: AbpFormFieldDefinition<TValue[K]>;
};

export type AbpFormControls<TValue extends Record<string, unknown>> = {
  readonly [K in keyof TValue]: AbpFormControl<TValue[K]>;
};

/**
 * A flat set of controls. Flat is the whole shape: ABP's extensible forms are a list of
 * properties, and nested groups and arrays can be added when something needs them.
 */
export interface AbpFormGroup<TValue extends Record<string, unknown> = Record<string, unknown>> {
  readonly controls: AbpFormControls<TValue>;
  /** The current values, as the object a save request takes. */
  readonly value: TValue;
  readonly valid: boolean;
  readonly invalid: boolean;
  readonly dirty: boolean;
  readonly touched: boolean;
  readonly errors: readonly AbpValidationError[];
  /** Server messages whose members matched no control, so none of them are lost. */
  readonly unmatchedServerErrors: readonly string[];
  /** @param name Name of the control, for code that does not know the shape */
  get(name: string): AbpFormControl | undefined;
  /**
   * Marks everything touched and reports whether the form may be submitted -- the one
   * call a submit handler needs.
   */
  validate(): boolean;
  /** @param value Values to write without marking anything dirty */
  patch(value: Partial<TValue>): void;
  /** @param value Becomes the new initial value of the controls it names */
  reset(value?: Partial<TValue>): void;
  markAllAsTouched(): void;
  /**
   * Puts what the server rejected next to the fields it rejected. Members are matched
   * case-insensitively and by their last segment, because ABP names them after the C#
   * property (`UserName`, `ExtraProperties.Title`) and the controls are named after the
   * DTO's JSON.
   * @param errors ABP's `validationErrors`
   */
  setServerErrors(errors: readonly AbpServerValidationError[] | undefined): void;
  clearServerErrors(): void;
}
