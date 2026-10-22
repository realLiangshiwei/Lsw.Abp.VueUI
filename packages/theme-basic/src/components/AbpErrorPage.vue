<script setup lang="ts">
import { DocumentService, inject, useLocalization } from '@lsw-abpvue/core';
import { useErrorPage } from '@lsw-abpvue/theme-shared';
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui';
import { watch } from 'vue';

/**
 * The errors that end the page rather than the request. It covers what is behind it
 * instead of replacing it, so going home leaves the application where it was.
 */
const errorPage = useErrorPage();
const localization = useLocalization();
const nativeDocument = inject(DocumentService).nativeDocument;
let previousFocus: HTMLElement | undefined;

watch(
  () => errorPage.current.value !== null,
  open => {
    if (open) previousFocus = nativeDocument?.activeElement as HTMLElement | undefined;
  },
  { flush: 'sync', immediate: true },
);

function restoreFocus(event: Event): void {
  const previous = previousFocus;
  const target = previous?.matches(':disabled')
    ? previous
        .closest('[role="dialog"]')
        ?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')
    : previous;
  if (target?.isConnected) {
    event.preventDefault();
    target.focus();
  }
}
</script>

<template>
  <AlertDialogRoot
    :open="errorPage.current.value !== null"
    @update:open="!$event && errorPage.clear()"
  >
    <AlertDialogPortal>
      <AlertDialogContent
        v-if="errorPage.current.value"
        class="abp-error-page d-flex align-items-center justify-content-center text-center"
        @close-auto-focus="restoreFocus"
      >
        <div class="p-4">
          <p class="display-1 mb-0">{{ errorPage.current.value.status || '' }}</p>
          <AlertDialogTitle as="h1" class="h4">
            {{ localization.t(errorPage.current.value.title) }}
          </AlertDialogTitle>
          <AlertDialogDescription
            as="p"
            :class="errorPage.current.value.details ? 'text-body-secondary' : 'visually-hidden'"
          >
            {{ localization.t(errorPage.current.value.details ?? errorPage.current.value.title) }}
          </AlertDialogDescription>

          <AlertDialogCancel type="button" class="btn btn-primary">
            {{ $t('AbpUi::Close') }}
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style scoped>
.abp-error-page {
  position: fixed;
  inset: 0;
  z-index: 1070;
  background: var(--abp-overlay-bg);
}
</style>
