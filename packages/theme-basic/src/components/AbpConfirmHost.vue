<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { ConfirmationStatus, useConfirmation } from '@lsw-abpvue/theme-shared';
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui';
import { computed, useId } from 'vue';

const confirmation = useConfirmation();
const localization = useLocalization();

const titleId = useId();
const current = confirmation.current;

const ICON = {
  neutral: 'bi bi-question-circle text-secondary',
  info: 'bi bi-info-circle text-info',
  success: 'bi bi-check-circle text-success',
  warning: 'bi bi-exclamation-triangle text-warning',
  error: 'bi bi-shield-exclamation text-danger',
} as const;

const message = computed(() => {
  const request = current.value;
  if (!request) return '';

  return localization.t(request.message, ...(request.options.messageLocalizationParams ?? []));
});

const title = computed(() => {
  const request = current.value;
  if (!request?.title) return '';

  return localization.t(request.title, ...(request.options.titleLocalizationParams ?? []));
});
</script>

<template>
  <AlertDialogRoot :open="current !== null" @update:open="!$event && confirmation.clear()">
    <AlertDialogPortal>
      <AlertDialogOverlay class="modal-backdrop show" />
      <AlertDialogContent
        v-if="current"
        class="modal d-block abp-confirm"
        :aria-label="title ? undefined : message"
        :aria-labelledby="title ? titleId : undefined"
        @escape-key-down="current.options.dismissible === false && $event.preventDefault()"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body d-flex gap-3">
              <i :class="current.options.iconClass ?? ICON[current.severity]" aria-hidden="true" />
              <div>
                <AlertDialogTitle v-if="title" :id="titleId" as="h5" class="modal-title">
                  {{ title }}
                </AlertDialogTitle>
                <AlertDialogDescription as="p" class="mb-0">
                  {{ message }}
                </AlertDialogDescription>
              </div>
            </div>

            <div class="modal-footer">
              <!--
                Plain buttons rather than AlertDialogAction / AlertDialogCancel: those
                close the dialog from their own click handler, which runs before ours and
                turns every answer into a dismissal.
              -->
              <button
                v-if="!current.options.hideCancelBtn"
                type="button"
                class="btn btn-outline-secondary"
                @click="confirmation.clear(ConfirmationStatus.reject)"
              >
                {{ localization.t(current.options.cancelText ?? 'AbpUi::Cancel') }}
              </button>
              <button
                v-if="!current.options.hideYesBtn"
                type="button"
                class="btn btn-primary"
                @click="confirmation.clear(ConfirmationStatus.confirm)"
              >
                {{ localization.t(current.options.yesText ?? 'AbpUi::Yes') }}
              </button>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style scoped>
/* Above a modal: a confirmation is usually asked from inside one. */
.abp-confirm {
  z-index: 1065;
}
</style>
