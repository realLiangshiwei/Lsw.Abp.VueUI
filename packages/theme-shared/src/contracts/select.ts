import type { AbpOption, AbpOptionValue } from './common.js';

export interface AbpSelectProps {
  modelValue?: AbpOptionValue | readonly AbpOptionValue[] | undefined;
  options: readonly AbpOption[];
  multiple?: boolean | undefined;
  /** Shown while nothing is selected; not itself selectable. */
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  invalid?: boolean | undefined;
  clearable?: boolean | undefined;
  id?: string | undefined;
  name?: string | undefined;
  ariaDescribedby?: string | undefined;
  ariaLabel?: string | undefined;
}

export interface AbpSelectEmits {
  'update:modelValue': [value: AbpOptionValue | AbpOptionValue[]];
}

export interface AbpSelectSlots {
  /** Renders one option in the list; the trigger keeps the plain label. */
  option?: (context: { option: AbpOption; selected: boolean }) => unknown;
}
