<template>
  <AbpPageAlerts />
  <div class="d-flex flex-wrap gap-2">
    <AbpButton @click="show">Show or replace alert</AbpButton>
    <AbpButton variant="secondary" @click="alerts.remove('catalog-offline')"
      >Remove alert</AbpButton
    >
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { AbpPageAlerts } from '@lsw-abpvue/theme-basic';
import { AbpButton, usePageAlert } from '@lsw-abpvue/theme-shared';
const alerts = usePageAlert();
function show(): void {
  alerts.show({
    id: 'catalog-offline',
    severity: 'warning',
    title: { key: 'Demo::Offline', defaultValue: 'Catalogue unavailable' },
    message: { key: 'Demo::Retry', defaultValue: 'Retry loading before editing records.' },
    dismissible: true,
  });
}
onBeforeUnmount(() => alerts.remove('catalog-offline'));
</script>
