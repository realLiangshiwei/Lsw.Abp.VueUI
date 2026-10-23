<template>
  <section
    v-if="allowed"
    class="abp-entity-changes"
    role="tabpanel"
    :aria-label="localization.t('AbpAuditLogging::EntityChanges')"
  >
    <AuditLogFilters
      :key="context"
      changes
      :can-export="permission.isGranted(AuditLoggingPolicyNames.Export)"
      :exporting="exporting"
      @apply="apply"
      @export="exportChanges"
    />
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpAuditLogging::EntityChanges"
    />
    <p v-if="error" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable')
      }}<AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <EntityChangeDetailsDialog
      v-if="selected"
      :entity-change-id="selected"
      @close="selected = undefined"
    />
    <EntityHistoryDialog
      v-if="history"
      :entity-id="history.entityId"
      :entity-type-full-name="history.entityTypeFullName"
      @close="history = undefined"
    />
  </section>
</template>
<script setup lang="ts">
import { AbpExtensibleTable, EXTENSIONS_IDENTIFIER } from '@lsw-abpvue/components';
import {
  AuditLoggingPolicyNames,
  EntityHistoryService,
  SHOW_ENTITY_HISTORY,
  type EntityHistorySelection,
} from '@lsw-abpvue/audit-logging/config';
import { AuditLogsService, type GetEntityChangesDto } from '@lsw-abpvue/audit-logging/proxy';
import { inject, provideAbp } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { ref, shallowRef, watch } from 'vue';
import { AuditLoggingComponents } from '../enums/components.js';
import { SHOW_ENTITY_DETAILS } from '../tokens/pages.token.js';
import { entityChangeQuery, type AuditFilterDraft } from '../utils/filters.js';
import { useAuditList } from '../utils/use-audit-list.js';
import { useAuditExport } from '../utils/use-audit-export.js';
import AuditLogFilters from './AuditLogFilters.vue';
import EntityChangeDetailsDialog from './EntityChangeDetailsDialog.vue';
import EntityHistoryDialog from './EntityHistoryDialog.vue';
const service = inject(AuditLogsService);
const historyService = inject(EntityHistoryService);
const showDetails = inject(SHOW_ENTITY_DETAILS, { optional: true });
const showHistory = inject(SHOW_ENTITY_HISTORY, { optional: true });
const initial: GetEntityChangesDto = {};
const { allowed, context, permission, localization, items, error, list, applied } = useAuditList(
  service.getEntityChanges,
  initial,
  'AuditLogging.EntityChanges',
  'changeTime',
);
const { exporting, exportToExcel } = useAuditExport();
const selected = ref<string>();
const history = shallowRef<EntityHistorySelection>();
function apply(draft: AuditFilterDraft): void {
  applied.value = entityChangeQuery(draft);
  list.get();
}
async function exportChanges(draft: AuditFilterDraft): Promise<void> {
  const query = { ...entityChangeQuery(draft), sorting: list.query.value.sorting };
  await exportToExcel(signal =>
    service.exportEntityChangesToExcel(query, { signal, skipHandleError: true }),
  );
}
provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: AuditLoggingComponents.EntityChanges },
  {
    provide: SHOW_ENTITY_DETAILS,
    useValue: (id: string) => {
      if (!allowed.value || !id) return;
      if (showDetails && showDetails !== historyService.showDetails) showDetails(id);
      else selected.value = id;
    },
  },
  {
    provide: SHOW_ENTITY_HISTORY,
    useValue: (entityId: string, entityTypeFullName: string) => {
      if (!allowed.value || !entityId || !entityTypeFullName) return;
      if (showHistory && showHistory !== historyService.show)
        showHistory(entityId, entityTypeFullName);
      else history.value = { entityId, entityTypeFullName };
    },
  },
]);
watch(
  context,
  () => {
    selected.value = undefined;
    history.value = undefined;
  },
  { flush: 'sync' },
);
</script>
