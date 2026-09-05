import { makeEnvironmentProviders, type EnvironmentProviders } from '@lsw-abpvue/core';
import { provideThemeComponents } from '@lsw-abpvue/theme-shared';
import AbpButton from '../components/AbpButton.vue';
import AbpConfirmHost from '../components/AbpConfirmHost.vue';
import AbpDatePicker from '../components/AbpDatePicker.vue';
import AbpFormField from '../components/AbpFormField.vue';
import AbpInput from '../components/AbpInput.vue';
import AbpModal from '../components/AbpModal.vue';
import AbpPagination from '../components/AbpPagination.vue';
import AbpSelect from '../components/AbpSelect.vue';
import AbpSpinner from '../components/AbpSpinner.vue';
import AbpToastHost from '../components/AbpToastHost.vue';
import AbpToggle from '../components/AbpToggle.vue';
import AbpTypeahead from '../components/AbpTypeahead.vue';

/** The twelve contracts, as this theme implements them. */
export function provideThemeBasicComponents(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideThemeComponents({
      AbpButton,
      AbpConfirmHost,
      AbpDatePicker,
      AbpFormField,
      AbpInput,
      AbpModal,
      AbpPagination,
      AbpSelect,
      AbpSpinner,
      AbpToastHost,
      AbpToggle,
      AbpTypeahead,
    }),
  ]);
}
