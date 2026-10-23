<template>
  <EntityHistoryDialog
    v-if="history.selected.value"
    :entity-id="history.selected.value.entityId"
    :entity-type-full-name="history.selected.value.entityTypeFullName"
    @close="history.close"
  />
  <EntityChangeDetailsDialog
    v-if="history.selectedChangeId.value"
    :entity-change-id="history.selectedChangeId.value"
    @close="history.close"
  />
</template>
<script setup lang="ts">
import { EntityHistoryService } from '@lsw-abpvue/audit-logging/config';
import { inject as injectAbp } from '@lsw-abpvue/core';
import EntityHistoryDialog from './EntityHistoryDialog.vue';
import EntityChangeDetailsDialog from './EntityChangeDetailsDialog.vue';
const history = injectAbp(EntityHistoryService);
</script>
