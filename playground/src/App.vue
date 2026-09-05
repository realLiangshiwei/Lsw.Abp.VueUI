<script setup lang="ts">
import { LayoutType } from '@lsw-abpvue/core';
import { AbpDynamicLayout } from '@lsw-abpvue/core/router';
import { usePageAlert } from '@lsw-abpvue/theme-shared';
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
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

<template>
  <AbpDynamicLayout :default-layout="LayoutType.application">
    <RouterView />
  </AbpDynamicLayout>
</template>
