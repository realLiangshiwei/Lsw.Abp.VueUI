import type { AbpButtonEmits, AbpButtonProps, AbpButtonSlots } from '../contracts/button.js';
import type { AbpConfirmHostProps } from '../contracts/confirm-host.js';
import type { AbpDatePickerEmits, AbpDatePickerProps } from '../contracts/date-picker.js';
import type { AbpFormFieldProps, AbpFormFieldSlots } from '../contracts/form-field.js';
import type { AbpInputEmits, AbpInputProps } from '../contracts/input.js';
import type { AbpModalEmits, AbpModalProps, AbpModalSlots } from '../contracts/modal.js';
import type { AbpPaginationEmits, AbpPaginationProps } from '../contracts/pagination.js';
import type { AbpSelectEmits, AbpSelectProps, AbpSelectSlots } from '../contracts/select.js';
import type { AbpSpinnerProps } from '../contracts/spinner.js';
import type { AbpToastHostProps } from '../contracts/toast-host.js';
import type { AbpToggleEmits, AbpToggleProps } from '../contracts/toggle.js';
import type {
  AbpTypeaheadEmits,
  AbpTypeaheadProps,
  AbpTypeaheadSlots,
} from '../contracts/typeahead.js';
import { defineThemeComponent } from './theme-component.js';

export const AbpModal = defineThemeComponent<AbpModalProps, AbpModalEmits, AbpModalSlots>(
  'AbpModal',
);
export const AbpToastHost = defineThemeComponent<AbpToastHostProps>('AbpToastHost');
export const AbpConfirmHost = defineThemeComponent<AbpConfirmHostProps>('AbpConfirmHost');
export const AbpButton = defineThemeComponent<AbpButtonProps, AbpButtonEmits, AbpButtonSlots>(
  'AbpButton',
);
export const AbpFormField = defineThemeComponent<
  AbpFormFieldProps,
  Record<never, never>,
  AbpFormFieldSlots
>('AbpFormField');
export const AbpInput = defineThemeComponent<AbpInputProps, AbpInputEmits>('AbpInput');
export const AbpSelect = defineThemeComponent<AbpSelectProps, AbpSelectEmits, AbpSelectSlots>(
  'AbpSelect',
);
export const AbpToggle = defineThemeComponent<AbpToggleProps, AbpToggleEmits>('AbpToggle');
export const AbpDatePicker = defineThemeComponent<AbpDatePickerProps, AbpDatePickerEmits>(
  'AbpDatePicker',
);
export const AbpTypeahead = defineThemeComponent<
  AbpTypeaheadProps,
  AbpTypeaheadEmits,
  AbpTypeaheadSlots
>('AbpTypeahead');
export const AbpPagination = defineThemeComponent<AbpPaginationProps, AbpPaginationEmits>(
  'AbpPagination',
);
export const AbpSpinner = defineThemeComponent<AbpSpinnerProps>('AbpSpinner');
