<script setup lang="ts">
import { AbpPage } from '@lsw-abpvue/components';
import ApplicationState from '../components/ApplicationState.vue';
import DiDemo from '../components/DiDemo.vue';
import ExtensionsDemo from '../components/ExtensionsDemo.vue';
</script>

<template>
  <AbpPage title="AbpUi::Welcome">
    <div class="row g-4">
      <div class="col-12 col-xl-6"><ApplicationState class="h-100" /></div>
      <div class="col-12 col-xl-6"><ExtensionsDemo class="h-100" /></div>
      <div class="col-12"><DiDemo /></div>
    </div>
  </AbpPage>
</template>
