import { defineService } from '@lsw-abpvue/core';
import { computed, shallowRef } from 'vue';
export interface EntityHistorySelection {
  entityId: string;
  entityTypeFullName: string;
}
export const EntityHistoryService = defineService('EntityHistoryService', () => {
  const selected = shallowRef<EntityHistorySelection>();
  const selectedChangeId = shallowRef<string>();
  return {
    selected: computed(() => selected.value),
    selectedChangeId: computed(() => selectedChangeId.value),
    show(entityId: string, entityTypeFullName: string): void {
      selectedChangeId.value = undefined;
      selected.value = { entityId, entityTypeFullName };
    },
    showDetails(entityChangeId: string): void {
      selected.value = undefined;
      selectedChangeId.value = entityChangeId;
    },
    close(): void {
      selected.value = undefined;
      selectedChangeId.value = undefined;
    },
  };
});
