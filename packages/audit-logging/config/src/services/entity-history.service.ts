import { defineService } from '@lsw-abpvue/core';
import { computed, shallowRef } from 'vue';
export interface EntityHistorySelection {
  entityId: string;
  entityTypeFullName: string;
}
export const EntityHistoryService = defineService('EntityHistoryService', () => {
  const selected = shallowRef<EntityHistorySelection>();
  return {
    selected: computed(() => selected.value),
    show(entityId: string, entityTypeFullName: string): void {
      selected.value = { entityId, entityTypeFullName };
    },
    close(): void {
      selected.value = undefined;
    },
  };
});
