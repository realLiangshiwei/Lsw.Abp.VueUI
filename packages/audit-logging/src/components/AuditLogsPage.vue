<template>
  <AbpPage v-if="allowed" class="abp-audit-logs" title="AbpAuditLogging::Menu:AuditLogging">
    <template #toolbar><AbpPageToolbar :key="context" :data="items" /></template>
    <AbpTabList
      v-model="tab"
      class="mb-3"
      :items="tabs"
      orientation="horizontal"
      :aria-label="localization.t('AbpAuditLogging::Menu:AuditLogging')"
    />
    <section
      v-show="tab === 'logs'"
      role="tabpanel"
      :aria-label="localization.t('AbpAuditLogging::AuditLogs')"
    >
      <AuditLogFilters
        :key="context"
        :disabled="!allowed"
        :can-export="permission.isGranted(AuditLoggingPolicyNames.Export)"
        :exporting="exporting"
        @apply="apply"
        @export="exportLogs"
      />
      <AbpExtensibleTable
        :key="context"
        :data="items"
        :list="list"
        record-key="id"
        caption="AbpAuditLogging::AuditLogs"
      />
      <p v-if="error" role="alert">
        {{ localization.t('AbpUi::ErrorLoadingDatatable')
        }}<AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </p>
    </section>
    <AbpReplaceable
      v-if="tab === 'changes'"
      :key="context"
      :replaceable-key="AuditLoggingComponents.EntityChanges"
      ><EntityChangesPage
    /></AbpReplaceable>
    <AuditLogDetailsDialog v-if="selected" :log-id="selected" @close="selected = undefined" />
  </AbpPage>
</template>
<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpTabList,
  EXTENSIONS_IDENTIFIER,
} from '@lsw-abpvue/components';
import { AuditLoggingPolicyNames } from '@lsw-abpvue/audit-logging/config';
import { AuditLogsService, type GetAuditLogListDto } from '@lsw-abpvue/audit-logging/proxy';
import { AbpReplaceable, getCurrentInjector, inject, provideAbp } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { ref, watch } from 'vue';
import { AuditLoggingComponents } from '../enums/components.js';
import { AUDIT_LOGS_PAGE } from '../tokens/pages.token.js';
import { auditLoggingExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { auditLogQuery, type AuditFilterDraft } from '../utils/filters.js';
import { useAuditList } from '../utils/use-audit-list.js';
import { useAuditExport } from '../utils/use-audit-export.js';
import AuditLogDetailsDialog from './AuditLogDetailsDialog.vue';
import AuditLogFilters from './AuditLogFilters.vue';
import EntityChangesPage from './EntityChangesPage.vue';
const service = inject(AuditLogsService);
const initial: GetAuditLogListDto = {};
const { allowed, context, permission, localization, items, error, list, applied } = useAuditList(
  service.getList,
  initial,
  'AuditLogging.AuditLogs',
  'executionTime',
);
const { exporting, exportToExcel } = useAuditExport();
const selected = ref<string>();
const tab = ref('logs');
const tabs = [
  { name: 'logs', text: 'AbpAuditLogging::AuditLogs' },
  { name: 'changes', text: 'AbpAuditLogging::EntityChanges' },
];
function apply(draft: AuditFilterDraft): void {
  applied.value = auditLogQuery(draft);
  list.get();
}
async function exportLogs(draft?: AuditFilterDraft): Promise<void> {
  const query = {
    ...(draft ? auditLogQuery(draft) : applied.value),
    sorting: list.query.value.sorting,
  };
  await exportToExcel(signal => service.exportToExcel(query, { signal, skipHandleError: true }));
}
provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: AuditLoggingComponents.AuditLogs },
  {
    provide: AUDIT_LOGS_PAGE,
    useValue: {
      openModal: (id: string) => {
        if (allowed.value && id) selected.value = id;
      },
      exportToExcel: exportLogs,
    },
  },
]);
const injector = getCurrentInjector();
watch(
  context,
  () => {
    injector?.runInContext(auditLoggingExtensionsResolver);
    selected.value = undefined;
    tab.value = 'logs';
  },
  { flush: 'sync' },
);
</script>
