export type AbpDateType = 'date' | 'time' | 'datetime';

export interface AbpDatePickerProps {
  /**
   * ISO 8601, the way ABP's DTOs carry dates. A `Date` would put every theme in charge
   * of the same timezone conversion, and the value has to go back over the wire anyway.
   */
  modelValue?: string | null | undefined;
  type?: AbpDateType | undefined;
  min?: string | null | undefined;
  max?: string | null | undefined;
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

export interface AbpDatePickerEmits {
  'update:modelValue': [value: string | null];
}
