<template>
  <AbpDynamicLayout :default-layout="LayoutType.application">
    <RouterView />
  </AbpDynamicLayout>
</template>

<script setup lang="ts">
import { startupError } from './startup';

// A backend that would not answer is the one thing the shell itself has to say, because
// nothing below it got as far as rendering.
const alerts = usePageAlert();
onMounted(() => {
  if (startupError.value) {
    alerts.show({ id: 'startup', severity: 'error', message: startupError.value });
  }
});
</script>
