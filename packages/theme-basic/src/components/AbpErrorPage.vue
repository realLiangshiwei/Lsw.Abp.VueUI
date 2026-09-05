<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { useErrorPage } from '@lsw-abpvue/theme-shared';

/**
 * The errors that end the page rather than the request. It covers what is behind it
 * instead of replacing it, so going home leaves the application where it was.
 */
const errorPage = useErrorPage();
const localization = useLocalization();
</script>

<template>
  <div
    v-if="errorPage.current.value"
    class="abp-error-page d-flex align-items-center justify-content-center text-center"
    role="alert"
  >
    <div class="p-4">
      <p class="display-1 mb-0">{{ errorPage.current.value.status || '' }}</p>
      <h1 class="h4">{{ localization.t(errorPage.current.value.title) }}</h1>
      <p v-if="errorPage.current.value.details" class="text-body-secondary">
        {{ localization.t(errorPage.current.value.details) }}
      </p>

      <button type="button" class="btn btn-primary" @click="errorPage.clear()">
        {{ $t('AbpUi::Close') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.abp-error-page {
  position: fixed;
  inset: 0;
  z-index: 1070;
  background: var(--bs-body-bg, #fff);
}
</style>
