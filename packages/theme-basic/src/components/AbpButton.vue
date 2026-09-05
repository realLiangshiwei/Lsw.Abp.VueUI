<script setup lang="ts">
import type { AbpButtonEmits, AbpButtonProps } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';

const props = withDefaults(defineProps<AbpButtonProps>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
});

const emit = defineEmits<AbpButtonEmits>();

const classes = computed(() => [
  'btn',
  props.outline ? `btn-outline-${props.variant}` : `btn-${props.variant}`,
  props.size === 'md' ? null : `btn-${props.size}`,
  props.block ? 'w-100' : null,
]);
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="ariaLabel"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
    <slot name="icon">
      <i v-if="iconClass && !loading" :class="iconClass" aria-hidden="true" />
    </slot>
    <slot />
  </button>
</template>
