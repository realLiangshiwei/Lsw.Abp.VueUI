<script setup lang="ts">
import { AbpPage } from '@lsw-abpvue/components';
import { defineAsyncComponent } from 'vue';
import ApplicationState from '../components/ApplicationState.vue';
import DiDemo from '../components/DiDemo.vue';
import ExtensionsDemo from '../components/ExtensionsDemo.vue';

const pro = import.meta.env.VITE_ABP_EDITION === 'pro';
const EditionsUsage = defineAsyncComponent(() =>
  import('@lsw-abpvue/saas').then(module => module.AbpEditionsUsageWidget),
);
const LatestTenants = defineAsyncComponent(() =>
  import('@lsw-abpvue/saas').then(module => module.AbpLatestTenantsWidget),
);
</script>

<template>
  <AbpPage title="AbpUi::Welcome">
    <div class="row g-4">
      <template v-if="pro">
        <div class="col-12 col-xl-6"><EditionsUsage /></div>
        <div class="col-12 col-xl-6"><LatestTenants /></div>
      </template>
      <div class="col-12 col-xl-6"><ApplicationState class="h-100" /></div>
      <div class="col-12 col-xl-6"><ExtensionsDemo class="h-100" /></div>
      <div class="col-12"><DiDemo /></div>
    </div>
  </AbpPage>
</template>
