<template>
  <AbpModal v-if="allowed" :visible="true" size="xl" @update:visible="$event || emit('close')">
    <template #header>{{ localization.t('AbpAuditLogging::Detail') }}</template>
    <AbpSpinner v-if="loading" />
    <p v-else-if="failed" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable')
      }}<AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <section v-else-if="data" class="abp-audit-details">
      <AbpTabList
        v-model="tab"
        :items="tabs"
        orientation="horizontal"
        :aria-label="localization.t('AbpAuditLogging::Detail')"
      />
      <dl
        v-if="tab === 'overall'"
        role="tabpanel"
        :aria-label="localization.t('AbpAuditLogging::Overall')"
      >
        <template v-for="field in fields" :key="field.name">
          <dt>{{ localization.t(`AbpAuditLogging::${field.label}`) }}</dt>
          <dd style="white-space: pre-wrap; overflow-wrap: anywhere">{{ data[field.name] }}</dd>
        </template>
        <dt>{{ localization.t('AbpAuditLogging::Time') }}</dt>
        <dd>{{ date(data.executionTime) }}</dd>
        <template v-if="data.impersonatorTenantId"
          ><dt>{{ localization.t('AbpAuditLogging::TenantImpersonator') }}</dt>
          <dd>{{ data.impersonatorTenantName || data.impersonatorTenantId }}</dd></template
        >
        <template v-if="data.impersonatorUserId"
          ><dt>{{ localization.t('AbpAuditLogging::UserImpersonator') }}</dt>
          <dd>{{ data.impersonatorUserName }} ({{ data.impersonatorUserId }})</dd></template
        >
        <dt>{{ localization.t('AbpAuditLogging::ExtraProperties') }}</dt>
        <dd>
          <pre style="white-space: pre-wrap; overflow-wrap: anywhere">{{
            JSON.stringify(data.extraProperties, null, 2)
          }}</pre>
        </dd>
      </dl>
      <div
        v-else-if="tab === 'actions'"
        class="table-responsive"
        role="tabpanel"
        :aria-label="localization.t('AbpAuditLogging::Actions')"
      >
        <table class="table table-striped">
          <thead>
            <tr>
              <th v-for="key in ['Actions', 'Duration', 'Parameters']" :key="key" scope="col">
                {{ localization.t(`AbpAuditLogging::${key}`) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(action, index) in data.actions" :key="action.id ?? index">
              <th scope="row">{{ action.serviceName }} - {{ action.methodName }}</th>
              <td>{{ action.executionDuration }}</td>
              <td>
                <pre style="white-space: pre-wrap; overflow-wrap: anywhere">{{
                  action.parameters
                }}</pre>
              </td>
            </tr>
            <tr v-if="!data.actions?.length">
              <td colspan="3">{{ localization.t('AbpUi::NoDataAvailableInDatatable') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else role="tabpanel" :aria-label="localization.t('AbpAuditLogging::Changes')">
        <EntityChangeDetails
          v-for="(change, index) in data.entityChanges"
          :key="change.id ?? index"
          :item-with-user-name="{ entityChange: change, userName: data.userName }"
        />
      </div>
    </section>
    <template #footer="{ close }"
      ><AbpButton variant="secondary" @click="close">{{
        localization.t('AbpAuditLogging::Close')
      }}</AbpButton></template
    >
  </AbpModal>
</template>
<script setup lang="ts">
import { AbpTabList } from '@lsw-abpvue/components';
import { AuditLogsService, type AuditLogDto } from '@lsw-abpvue/audit-logging/proxy';
import { inject } from '@lsw-abpvue/core';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, ref, watch } from 'vue';
import { useAuditLogging } from '../utils/use-audit-logging.js';
import { useAuditRequest } from '../utils/use-audit-request.js';
import { AuditLogResponseError } from '../utils/response-error.js';
import EntityChangeDetails from './EntityChangeDetails.vue';
const props = defineProps<{ logId: string }>();
const emit = defineEmits<{ close: [] }>();
const service = inject(AuditLogsService);
const { allowed, context, localization, date } = useAuditLogging();
const { data, loading, failed, run, reset } = useAuditRequest<AuditLogDto>(context);
const tab = ref('overall');
const tabs = computed(() => [
  { name: 'overall', text: 'AbpAuditLogging::Overall' },
  {
    name: 'actions',
    text: `${localization.t('AbpAuditLogging::Actions')} (${data.value?.actions?.length ?? 0})`,
  },
  ...(data.value?.entityChanges?.length
    ? [
        {
          name: 'changes',
          text: `${localization.t('AbpAuditLogging::Changes')} (${data.value.entityChanges.length})`,
        },
      ]
    : []),
]);
const fields = [
  { name: 'httpStatusCode', label: 'HttpStatusCode' },
  { name: 'httpMethod', label: 'HttpMethod' },
  { name: 'url', label: 'Url' },
  { name: 'clientIpAddress', label: 'ClientIpAddress' },
  { name: 'clientName', label: 'ClientName' },
  { name: 'exceptions', label: 'Exceptions' },
  { name: 'userName', label: 'UserName' },
  { name: 'executionDuration', label: 'Duration' },
  { name: 'browserInfo', label: 'BrowserInfo' },
  { name: 'applicationName', label: 'ApplicationName' },
  { name: 'correlationId', label: 'CorrelationId' },
  { name: 'comments', label: 'Comments' },
] as const;
async function load(): Promise<void> {
  if (!allowed.value || !props.logId) return reset();
  tab.value = 'overall';
  const id = props.logId;
  await run(async signal => {
    const value = await service.get(id, { signal, skipHandleError: true });
    if (value.id !== id) throw new AuditLogResponseError();
    return value;
  });
}
watch(() => props.logId, load, { immediate: true });
watch(context, () => emit('close'), { flush: 'sync' });
</script>
