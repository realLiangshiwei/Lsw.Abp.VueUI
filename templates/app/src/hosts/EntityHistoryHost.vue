<template>
  <component :is="host" v-if="visible" />
  <AbpModal
    v-if="failed && visible"
    :visible="true"
    :dirty="false"
    @update:visible="$event || history.close()"
  >
    <template #header>{{ t('AbpAuditLogging::ChangeHistory') }}</template>
    <div role="alert">
      <p>{{ t('AbpUi::ErrorLoadingDatatable') }}</p>
      <AbpButton :loading="loading" :disabled="!retryHost" @click="retryHost?.()">
        {{ t('AbpUi::Refresh') }}
      </AbpButton>
    </div>
    <template #footer="{ close }">
      <AbpButton variant="secondary" @click="close">{{ t('AbpUi::Cancel') }}</AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { EntityHistoryService } from '@lsw-abpvue/audit-logging/config';
import { ConfigStateService } from '@lsw-abpvue/core';

const history = injectAbp(EntityHistoryService);
const config = injectAbp(ConfigStateService);
const { t } = useLocalization();
const visible = computed(() => Boolean(history.selected.value || history.selectedChangeId.value));
const failed = ref(false);
const loading = ref(false);
const retryHost = shallowRef<(() => void) | undefined>();
watch(
  () =>
    JSON.stringify([
      config.snapshot().currentUser.id,
      config.snapshot().currentUser.isAuthenticated,
      config.snapshot().currentTenant.id,
      config.snapshot().multiTenancy.userSharingStrategy,
      config.snapshot().auth.grantedPolicies,
    ]),
  () => history.close(),
  { flush: 'sync' },
);
const host = defineAsyncComponent({
  loader: async () => {
    loading.value = true;
    try {
      const module = await import('@lsw-abpvue/audit-logging');
      const component = await module.loadEntityHistoryHost();
      failed.value = false;
      retryHost.value = undefined;
      return component;
    } finally {
      loading.value = false;
    }
  },
  onError(_error, retry) {
    failed.value = true;
    retryHost.value = retry;
  },
});
</script>
