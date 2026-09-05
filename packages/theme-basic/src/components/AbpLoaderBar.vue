<script setup lang="ts">
import { useHttpWait } from '@lsw-abpvue/core';

/** One bar for every request in flight, so a page never looks finished while it is not. */
const httpWait = useHttpWait();
</script>

<template>
  <div
    v-show="httpWait.loading.value"
    class="abp-loader-bar"
    role="progressbar"
    :aria-label="$t('AbpUi::LoadingWithThreeDot')"
    aria-busy="true"
  />
</template>

<style scoped>
.abp-loader-bar {
  position: fixed;
  top: 0;
  inset-inline-start: 0;
  z-index: 1100;
  height: 3px;
  width: 100%;
  background: var(--abp-loader-bar-color, var(--bs-primary, #0d6efd));
  animation: abp-loader-bar 1s ease-in-out infinite;
  transform-origin: 0 50%;
}

@keyframes abp-loader-bar {
  0% {
    transform: scaleX(0);
  }

  50% {
    transform: scaleX(0.7);
  }

  100% {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .abp-loader-bar {
    animation: none;
  }
}
</style>
