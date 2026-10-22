<template>
  <AbpModal :visible="true" size="lg" @update:visible="$event || emit('close')">
    <template #header
      >{{ localization.t('AbpIdentity::SecurityLogs') }}:
      {{ localization.t('AbpIdentity::Details') }}</template
    >
    <AbpSpinner v-if="loading" />
    <div v-else-if="failed" role="alert">
      <p>{{ failureText }}</p>
      <AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <table v-else-if="record" class="table table-striped">
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <th scope="row">{{ localization.t(row.label) }}</th>
          <td style="overflow-wrap: anywhere">{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
    <template #footer="{ close }"
      ><AbpButton variant="secondary" @click="close">{{
        localization.t('AbpUi::Close')
      }}</AbpButton></template
    >
  </AbpModal>
</template>
<script setup lang="ts">
import {
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  IdentitySecurityLogService,
  type IdentitySecurityLogDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { formatIdentityUserDetailsDate } from '../utils/user-details.js';
const props = defineProps<{ logId: string }>();
const emit = defineEmits<{ close: [] }>();
const service = injectAbp(IdentitySecurityLogService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const record = shallowRef<IdentitySecurityLogDto>();
const loading = ref(false);
const failed = ref(false);
let revision = 0;
let pending: AbortController | undefined;
const allowed = computed(() => permission.isGranted('AbpIdentity.SecurityLogs'));
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    allowed.value,
  ]),
);
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const rows = computed(() => {
  const item = record.value;
  if (!item) return [];
  return [
    {
      label: 'AbpIdentity::Date',
      value: formatIdentityUserDetailsDate(
        item.creationTime,
        config.snapshot().localization.currentCulture,
      ),
    },
    { label: 'AbpIdentity::SecurityLogs:Application', value: item.applicationName },
    { label: 'AbpIdentity::SecurityLogs:Identity', value: item.identity },
    { label: 'AbpIdentity::SecurityLogs:Action', value: item.action },
    { label: 'AbpIdentity::DisplayName:UserId', value: item.userId },
    { label: 'AbpIdentity::SecurityLogs:UserName', value: item.userName },
    {
      label: 'AbpIdentity::Tenant',
      value: item.tenantId,
    },
    {
      label: 'AbpAccount::TenantName',
      value: item.tenantName,
    },
    { label: 'AbpIdentity::SecurityLogs:Client', value: item.clientId },
    { label: 'AbpIdentity::SecurityLogs:CorrelationId', value: item.correlationId },
    { label: 'AbpIdentity::SecurityLogs:IpAddress', value: item.clientIpAddress },
    { label: 'AbpIdentity::SecurityLogs:Browser', value: item.browserInfo },
  ];
});
function reset(): void {
  revision += 1;
  pending?.abort();
  pending = undefined;
  record.value = undefined;
  loading.value = false;
  failed.value = false;
}
async function load(): Promise<void> {
  reset();
  if (!allowed.value || !props.logId) return;
  const own = revision;
  pending = new AbortController();
  const signal = pending.signal;
  loading.value = true;
  try {
    const value = await service.get(props.logId, { signal, skipHandleError: true });
    if (own !== revision || signal.aborted) return;
    if (value.id !== props.logId)
      throw new TypeError('The security log does not match the selected record.');
    record.value = value;
  } catch {
    if (own === revision && !signal.aborted) failed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}
watch(() => props.logId, load, { immediate: true });
watch(
  context,
  () => {
    reset();
    emit('close');
  },
  { flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
