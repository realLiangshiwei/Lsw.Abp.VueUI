export type AbpInputType =
  'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea';

export interface AbpInputProps {
  modelValue?: string | number | null | undefined;
  type?: AbpInputType | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  invalid?: boolean | undefined;
  id?: string | undefined;
  name?: string | undefined;
  autocomplete?: string | undefined;
  /** `textarea` only. */
  rows?: number | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  maxlength?: number | undefined;
  /** Adds the show/hide toggle ABP's password fields have. `password` only. */
  revealable?: boolean | undefined;
  ariaDescribedby?: string | undefined;
  ariaLabel?: string | undefined;
}

export interface AbpInputEmits {
  /** A `number` input emits a number, everything else a string. */
  'update:modelValue': [value: string | number | null];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}
