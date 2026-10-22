import { defineService, type ServiceOf } from '@lsw-abpvue/core';
import type { OrganizationUnitWithDetailsDto } from '@lsw-abpvue/identity-pro/proxy';
import { computed, shallowRef } from 'vue';

export interface OrganizationUnitsState {
  selectedUnit: OrganizationUnitWithDetailsDto | undefined;
}

export const OrganizationUnitsStateService = defineService('OrganizationUnitsStateService', () => {
  const selected = shallowRef<OrganizationUnitWithDetailsDto>();
  const selectedNode = computed(() => selected.value);
  return {
    state: computed<OrganizationUnitsState>(() => ({ selectedUnit: selected.value })),
    getSelectedNode: () => selectedNode,
    setSelectedUnit: (unit: OrganizationUnitWithDetailsDto | undefined): void => {
      selected.value = unit;
    },
    removeSelectedNode: (): void => {
      selected.value = undefined;
    },
    refreshSelectedNode: (): void => {
      if (selected.value) selected.value = { ...selected.value };
    },
  };
});
export type OrganizationUnitsStateService = ServiceOf<typeof OrganizationUnitsStateService>;
