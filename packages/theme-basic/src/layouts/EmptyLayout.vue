<script setup lang="ts">
import AbpConfirmHost from '../components/AbpConfirmHost.vue';
import AbpErrorPage from '../components/AbpErrorPage.vue';
import AbpLoaderBar from '../components/AbpLoaderBar.vue';
import AbpToastHost from '../components/AbpToastHost.vue';
</script>

<template>
  <AbpLoaderBar />
  <slot />
  <AbpToastHost />
  <AbpConfirmHost />
  <AbpErrorPage />
</template>
