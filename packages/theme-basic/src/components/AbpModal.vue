<script setup lang="ts">
import type { AbpModalEmits, AbpModalProps, AbpModalSlots } from '@lsw-abpvue/theme-shared';
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  VisuallyHidden,
} from 'reka-ui';
import { computed, useId, useSlots, watch } from 'vue';

const props = withDefaults(defineProps<AbpModalProps>(), { size: 'md' });

const emit = defineEmits<AbpModalEmits>();
const slots = defineSlots<AbpModalSlots>();

const titleId = useId();
const hasHeader = computed(() => Boolean(useSlots().header));

const SIZE_CLASS = {
  sm: 'modal-sm',
  md: '',
  lg: 'modal-lg',
  xl: 'modal-xl',
} as const;

watch(
  () => props.visible,
  (open, wasOpen) => {
    // The immediate case is a modal that starts closed; it has not disappeared.
    if (!open && wasOpen === undefined) return;
    if (!open) {
      emit('disappear');
      return;
    }

    emit('init');
    emit('appear');
  },
  { immediate: true },
);

/** reka-ui reports every close the same way; `busy` is what refuses them. */
function onOpenChange(open: boolean): void {
  if (!open && props.busy) return;
  emit('update:visible', open);
}
</script>

<template>
  <DialogRoot :open="visible" :modal="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="abp-modal__backdrop" />
      <DialogContent
        class="abp-modal"
        role="dialog"
        aria-modal="true"
        :aria-busy="busy ? 'true' : undefined"
        :aria-label="hasHeader ? undefined : ariaLabel"
        :aria-labelledby="hasHeader ? titleId : undefined"
        :aria-describedby="undefined"
        @escape-key-down="busy && $event.preventDefault()"
        @pointer-down-outside="busy && $event.preventDefault()"
        @interact-outside="busy && $event.preventDefault()"
      >
        <div
          class="modal-dialog"
          :class="[SIZE_CLASS[size], centered ? 'modal-dialog-centered' : null]"
        >
          <div class="modal-content">
            <!-- reka-ui asks for a title on every dialog, and so does the contract. -->
            <VisuallyHidden v-if="!slots.header">
              <DialogTitle>{{ ariaLabel }}</DialogTitle>
            </VisuallyHidden>

            <div v-if="slots.header" class="modal-header">
              <DialogTitle :id="titleId" as="div" class="modal-title">
                <slot name="header" />
              </DialogTitle>
              <button
                type="button"
                class="btn-close"
                :disabled="busy"
                :aria-label="$t('AbpUi::Close')"
                @click="onOpenChange(false)"
              />
            </div>

            <div class="modal-body">
              <slot />
            </div>

            <div v-if="slots.footer" class="modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.abp-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1050;
  background-color: var(--abp-scrim);
}

.abp-modal {
  position: fixed;
  inset: 0;
  z-index: 1055;
  overflow-y: auto;
}
</style>
