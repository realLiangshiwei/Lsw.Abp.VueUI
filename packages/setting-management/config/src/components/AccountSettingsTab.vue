<script setup lang="ts">
import { inject as injectAbp, useConfigState, useLocalization } from '@lsw-abpvue/core';
import { AbpButton, AbpSpinner, AbpToggle, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, onMounted, ref, shallowRef } from 'vue';
import {
  AccountSettingsService,
  type AccountSettings,
} from '../services/account-settings.service.js';

const service = injectAbp(AccountSettingsService);
const config = useConfigState();
const localization = useLocalization();
const toaster = useToaster();
const registrationLabel = computed(() =>
  localization.t(
    localization.findKey(
      ['AbpAccount'],
      [
        'DisplayName:IsSelfRegistrationEnabled',
        'DisplayName:Abp.Account.IsSelfRegistrationEnabled',
      ],
    ) ?? 'AbpUi::DefaultErrorMessage',
  ),
);
const localLoginLabel = computed(() =>
  localization.t(
    localization.findKey(
      ['AbpAccount'],
      ['DisplayName:EnableLocalLogin', 'DisplayName:Abp.Account.EnableLocalLogin'],
    ) ?? 'AbpUi::DefaultErrorMessage',
  ),
);
const settings = ref<AccountSettings>({
  isSelfRegistrationEnabled: false,
  enableLocalLogin: false,
});
const saved = shallowRef<AccountSettings>();
const loading = ref(true);
const busy = ref(false);
const failed = ref(false);
const dirty = computed(
  () =>
    saved.value !== undefined &&
    (settings.value.isSelfRegistrationEnabled !== saved.value.isSelfRegistrationEnabled ||
      settings.value.enableLocalLogin !== saved.value.enableLocalLogin),
);

onMounted(async () => {
  try {
    const current = await service.get();
    settings.value = { ...current };
    saved.value = { ...current };
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (!service.update || busy.value || !dirty.value) return;
  busy.value = true;
  try {
    const current = { ...settings.value };
    await service.update(current);
    saved.value = current;
    await config.refreshAppState();
    toaster.success('AbpSettingManagement::SavedSuccessfully');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AbpSpinner v-if="loading" />
  <p v-else-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
  <template v-else>
    <h2 class="h5 mb-3">{{ $t('AbpAccount::Menu:Account') }}</h2>
    <form class="abp-settings__form" novalidate @submit.prevent="submit">
      <AbpToggle
        v-model="settings.isSelfRegistrationEnabled"
        name="isSelfRegistrationEnabled"
        :label="registrationLabel"
        :disabled="!service.update || busy"
      />
      <AbpToggle
        v-model="settings.enableLocalLogin"
        name="enableLocalLogin"
        :label="localLoginLabel"
        :disabled="!service.update || busy"
      />
      <div v-if="service.update" class="abp-settings__actions">
        <AbpButton type="submit" variant="primary" :loading="busy" :disabled="!dirty">
          {{ $t('AbpUi::Save') }}
        </AbpButton>
      </div>
    </form>
  </template>
</template>
