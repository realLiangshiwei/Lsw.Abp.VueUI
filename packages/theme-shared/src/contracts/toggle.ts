import type { AbpOption, AbpOptionValue } from './common.js';

/**
 * One contract over checkbox, switch and radio group. They differ in how they look and
 * in which reka-ui primitive is behind them, never in what a form does with them, and
 * three contracts would be three implementations per theme instead of one.
 */
export interface AbpToggleProps {
  /** A boolean for checkbox and switch, the chosen value for a radio group. */
  modelValue?: boolean | AbpOptionValue | undefined;
  variant?: 'checkbox' | 'switch' | 'radio' | undefined;
  /** Already localized; sits next to the control. `radio` takes its labels from `options`. */
  label?: string | undefined;
  /** `radio` only, and required there. */
  options?: readonly AbpOption[] | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Checkbox only: neither checked nor unchecked, for a partly selected group. */
  indeterminate?: boolean | undefined;
  id?: string | undefined;
  name?: string | undefined;
  ariaDescribedby?: string | undefined;
  ariaLabel?: string | undefined;
}

export interface AbpToggleEmits {
  'update:modelValue': [value: boolean | AbpOptionValue];
}
