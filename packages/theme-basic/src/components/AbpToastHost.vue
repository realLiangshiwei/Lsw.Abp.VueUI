<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { useToaster, type AbpToastHostProps } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';

const props = defineProps<AbpToastHostProps>();

const toaster = useToaster();
const localization = useLocalization();

const ICON = {
  neutral: 'bi bi-exclamation-triangle',
  info: 'bi bi-info-circle',
  success: 'bi bi-check-circle',
  warning: 'bi bi-exclamation-triangle',
  error: 'bi bi-shield-exclamation',
} as const;

const BACKGROUND = {
  neutral: 'text-bg-secondary',
  info: 'text-bg-info',
  success: 'text-bg-success',
  warning: 'text-bg-warning',
  error: 'text-bg-danger',
} as const;

const mine = computed(() =>
  toaster.toasts.value.filter(toast => toast.options.containerKey === props.containerKey),
);
</script>

<template>
  <!--
    Two live regions rather than one: an error has to interrupt, and everything else has
    to wait its turn. A screen reader only honours the politeness of the region a message
    appears in, so the two cannot be the same element.
  -->
  <div class="abp-toasts toast-container">
    <div
      v-for="toast in mine"
      :key="String(toast.id)"
      class="toast show align-items-center border-0"
      :class="BACKGROUND[toast.severity]"
      :role="toast.severity === 'error' ? 'alert' : 'status'"
      :aria-live="toast.severity === 'error' ? 'assertive' : 'polite'"
      aria-atomic="true"
      @click="toast.options.tapToDismiss && toaster.remove(toast.id)"
    >
      <div class="d-flex">
        <div class="toast-body d-flex gap-2">
          <i :class="toast.options.iconClass ?? ICON[toast.severity]" aria-hidden="true" />
          <div>
            <strong v-if="toast.title" class="d-block">
              {{ localization.t(toast.title, ...(toast.options.titleLocalizationParams ?? [])) }}
            </strong>
            {{ localization.t(toast.message, ...(toast.options.messageLocalizationParams ?? [])) }}
          </div>
        </div>

        <button
          v-if="toast.options.closable !== false"
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          :aria-label="$t('AbpUi::Close')"
          @click.stop="toaster.remove(toast.id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.abp-toasts {
  position: fixed;
  top: 1rem;
  inset-inline-end: 1rem;
  z-index: 1090;
}
</style>
