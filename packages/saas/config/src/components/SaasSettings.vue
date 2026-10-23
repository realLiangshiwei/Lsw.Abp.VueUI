<template>
  <AbpSpinner v-if="busy && !ready" />
  <p v-if="failed" role="alert">
    {{ $t('AbpUi::ErrorLoadingDatatable') }}
    <AbpButton variant="secondary" :disabled="busy" @click="run(false)">{{
      $t('AbpUi::Refresh')
    }}</AbpButton>
  </p>
  <form v-if="ready" @submit.prevent="run(true)">
    <AbpToggle
      v-model="enabled"
      :disabled="busy || !allowed"
      :label="$t('Saas::DisplayName:Saas.EnableTenantBasedConnectionStringManagement')"
    />
    <p class="form-text">
      {{ $t('Saas::Description:Saas.EnableTenantBasedConnectionStringManagement') }}
    </p>
    <AbpButton type="submit" :loading="busy" :disabled="!allowed">{{
      $t('AbpUi::Save')
    }}</AbpButton>
  </form>
</template>

<script setup lang="ts">
import { ConfigStateService, inject as injectAbp, usePermission } from '@lsw-abpvue/core';
import { SettingsService } from '@lsw-abpvue/saas/proxy';
import { AbpButton, AbpSpinner, AbpToggle, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { SaasPolicyNames } from '../enums/policy-names.js';

const settings = injectAbp(SettingsService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const toaster = useToaster();
const enabled = ref(false);
const busy = ref(false);
const ready = ref(false);
const failed = ref(false);
const settingPolicy: string = SaasPolicyNames.SettingManagement;
const context = computed(
  () => `${config.snapshot().currentUser.id}:${config.snapshot().currentTenant.id}`,
);
const allowed = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    !config.snapshot().currentTenant.id &&
    permission.isGranted(settingPolicy),
);
let controller = new AbortController();
let revision = 0;
function reset() {
  revision++;
  controller.abort();
  controller = new AbortController();
  busy.value = false;
  ready.value = false;
  failed.value = false;
}
async function run(write: boolean) {
  if (busy.value || !allowed.value || (write && !ready.value)) return;
  const own = ++revision;
  busy.value = true;
  failed.value = false;
  try {
    if (write) {
      await settings.update(
        { enableTenantBasedConnectionStringManagement: enabled.value },
        { signal: controller.signal },
      );
      if (own !== revision) return;
      await config.refreshAppState();
      if (own === revision) toaster.success('AbpUi::SavedSuccessfully');
    } else {
      const current = await settings.get({ signal: controller.signal });
      if (own !== revision) return;
      enabled.value = current.enableTenantBasedConnectionStringManagement ?? false;
      ready.value = true;
    }
  } catch {
    // The transport reports errors; a failed write is reconciled by reading the current setting.
    if (own === revision) {
      failed.value = true;
      ready.value = false;
    }
  } finally {
    if (own === revision) busy.value = false;
  }
}
watch(
  [context, allowed],
  () => {
    reset();
    void run(false);
  },
  { immediate: true },
);
onScopeDispose(reset);
</script>
