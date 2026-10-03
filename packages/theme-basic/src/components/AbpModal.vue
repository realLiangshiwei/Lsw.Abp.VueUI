<script setup lang="ts">
import type { AbpModalEmits, AbpModalProps, AbpModalSlots } from '@lsw-abpvue/theme-shared';
import { useModal } from '@lsw-abpvue/theme-shared';
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  VisuallyHidden,
} from 'reka-ui';
import { computed, useSlots, watch } from 'vue';

const props = withDefaults(defineProps<AbpModalProps>(), { size: 'md' });

const emit = defineEmits<AbpModalEmits>();
const slots = defineSlots<AbpModalSlots>();
const { requestClose, markDirty } = useModal(props, () => emit('update:visible', false));

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

function onOpenChange(open: boolean): void {
  if (!open) void requestClose();
}
</script>

<template>
  <DialogRoot :open="visible" :modal="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="abp-modal__backdrop" />
      <DialogContent
        class="modal d-block"
        role="dialog"
        aria-modal="true"
        :aria-busy="busy ? 'true' : undefined"
        :aria-label="hasHeader ? undefined : ariaLabel"
        :aria-describedby="undefined"
        @escape-key-down="busy && $event.preventDefault()"
        @pointer-down-outside="busy && $event.preventDefault()"
        @interact-outside="busy && $event.preventDefault()"
        @click.self="requestClose"
      >
        <div
          class="modal-dialog modal-dialog-scrollable"
          :class="[SIZE_CLASS[size], centered ? 'modal-dialog-centered' : null]"
        >
          <div class="modal-content">
            <!-- reka-ui asks for a title on every dialog, and so does the contract. -->
            <VisuallyHidden v-if="!slots.header">
              <DialogTitle>{{ ariaLabel }}</DialogTitle>
            </VisuallyHidden>

            <div v-if="slots.header" class="modal-header">
              <DialogTitle as="div" class="modal-title">
                <slot name="header" />
              </DialogTitle>
              <button
                type="button"
                class="btn-close"
                :disabled="busy"
                :aria-label="$t('AbpUi::Close')"
                @click="requestClose"
              />
            </div>

            <div class="modal-body" @input="markDirty" @change="markDirty">
              <slot />
            </div>

            <div v-if="slots.footer" class="modal-footer">
              <slot name="footer" :close="requestClose" />
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
