<template>
  <EntityHistoryDialog
    v-if="history.selected.value"
    :entity-id="history.selected.value.entityId"
    :entity-type-full-name="history.selected.value.entityTypeFullName"
    @close="history.close"
  />
</template>
<script setup lang="ts">
import { EntityHistoryService } from '@lsw-abpvue/audit-logging/config';
import { inject as injectAbp } from '@lsw-abpvue/core';
import EntityHistoryDialog from './EntityHistoryDialog.vue';
const history = injectAbp(EntityHistoryService);
</script>
