<template>
  <AbpDynamicLayout :default-layout="LayoutType.application">
    <RouterView />
    <!-- abpv:begin audit-logging -->
    <EntityHistoryHost />
    <!-- abpv:end audit-logging -->
    <!-- abpv:begin gdpr -->
    <AbpGdprCookieConsent />
    <!-- abpv:end gdpr -->
  </AbpDynamicLayout>
</template>

<script setup lang="ts">
import { startupError } from './startup';
// abpv:begin audit-logging
import EntityHistoryHost from './hosts/EntityHistoryHost.vue';
// abpv:end audit-logging
// abpv:begin gdpr
import { AbpGdprCookieConsent } from '@lsw-abpvue/gdpr/config';
// abpv:end gdpr

// A backend that would not answer is the one thing the shell itself has to say, because
// nothing below it got as far as rendering.
const alerts = usePageAlert();
onMounted(() => {
  if (startupError.value) {
    alerts.show({ id: 'startup', severity: 'error', message: startupError.value });
  }
});
</script>
