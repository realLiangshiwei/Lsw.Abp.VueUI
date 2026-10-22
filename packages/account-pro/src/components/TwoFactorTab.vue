<template>
  <div>
    <p v-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton v-if="failed" :disabled="busy" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    <form v-if="loaded" @submit.prevent="save">
      <AbpToggle
        v-model="enabled"
        :disabled="busy || needsReload"
        :label="$t('AbpAccount::DisplayName:TwoFactorEnabled')"
      />
      <p>{{ $t('AbpAccount::TwoFactorEnabledInfo') }}</p>
      <AbpButton type="submit" :disabled="busy || needsReload">{{ $t('AbpUi::Save') }}</AbpButton>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ProfileService } from '@lsw-abpvue/account-pro/proxy';
import { inject as injectAbp } from '@lsw-abpvue/core';
import { AbpButton, AbpToggle, useToaster } from '@lsw-abpvue/theme-shared';
import { onMounted, ref } from 'vue';
import { useAccountOperation } from '../utils/use-account-operation.js';
const service = injectAbp(ProfileService);
const toaster = useToaster();
const { busy, failed, needsReload, run } = useAccountOperation();
const enabled = ref(false);
const loaded = ref(false);
function load(): Promise<boolean> {
  return run(
    signal => service.getTwoFactorEnabled({ signal }),
    value => {
      enabled.value = value;
      loaded.value = true;
    },
  );
}
async function save(): Promise<void> {
  const value = enabled.value;
  await run(
    signal => service.setTwoFactorEnabled(value, { signal }),
    () => toaster.success('AbpUi::SavedSuccessfully'),
    true,
  );
}
onMounted(load);
</script>
