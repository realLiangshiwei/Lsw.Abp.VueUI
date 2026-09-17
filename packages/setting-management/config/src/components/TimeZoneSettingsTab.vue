<script setup lang="ts">
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { TimeZoneSettingsService } from '@lsw-abpvue/setting-management/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpSelect,
  AbpSpinner,
  useToaster,
  type AbpOption,
} from '@lsw-abpvue/theme-shared';
import { onMounted, ref, shallowRef } from 'vue';

const timeZones = injectAbp(TimeZoneSettingsService);
const localization = useLocalization();
const toaster = useToaster();

const loading = ref(true);
const busy = ref(false);
const selected = ref('');
const options = shallowRef<AbpOption[]>([]);

onMounted(async () => {
  try {
    const [current, all] = await Promise.all([timeZones.get(), timeZones.getTimezones()]);
    // The list is localized by the server -- the first entry is its "default time zone".
    options.value = all.map(zone => ({ value: zone.value ?? '', label: zone.name ?? '' }));
    selected.value = current;
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  busy.value = true;

  try {
    await timeZones.update(selected.value);
    toaster.success('AbpSettingManagement::SavedSuccessfully');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AbpSpinner v-if="loading" />

  <template v-else>
    <h2 class="h5 mb-3">{{ $t('AbpSettingManagement::Menu:TimeZone') }}</h2>

    <form novalidate @submit.prevent="submit">
      <AbpFormField
        :label="localization.t('AbpSettingManagement::DisplayName:Timezone')"
        :hint="localization.t('AbpSettingManagement::TimezoneHelpText')"
      >
        <template #default="{ id, describedBy }">
          <AbpSelect
            :id="id"
            v-model="selected"
            :options="options"
            :aria-describedby="describedBy"
          />
        </template>
      </AbpFormField>

      <AbpButton type="submit" variant="primary" :loading="busy">
        {{ $t('AbpSettingManagement::Save') }}
      </AbpButton>
    </form>
  </template>
</template>
