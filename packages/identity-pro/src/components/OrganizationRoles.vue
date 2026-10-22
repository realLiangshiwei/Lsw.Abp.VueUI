<template>
  <OrganizationAssignments
    kind="roles"
    :selected-organization-unit="selectedOrganizationUnit"
    @added="emit('added')"
    @deleted="emit('deleted')"
  />
</template>
<script setup lang="ts">
import type { OrganizationUnitWithDetailsDto } from '@lsw-abpvue/identity-pro/proxy';
import OrganizationAssignments from './OrganizationAssignments.vue';
defineProps<{ selectedOrganizationUnit: OrganizationUnitWithDetailsDto }>();
const emit = defineEmits<{ added: []; deleted: [] }>();
</script>
