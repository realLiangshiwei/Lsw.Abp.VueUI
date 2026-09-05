<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import type { AbpSpinnerProps } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';

const props = withDefaults(defineProps<AbpSpinnerProps>(), { size: 'md' });

const localization = useLocalization();
const name = computed(
  () =>
    props.label ?? localization.t({ key: 'AbpUi::LoadingWithThreeDot', defaultValue: 'Loading…' }),
);
</script>

<template>
  <span
    class="spinner-border"
    :class="[size === 'sm' ? 'spinner-border-sm' : null, overlay ? 'abp-spinner--overlay' : null]"
    role="status"
    :aria-label="name"
  />
</template>

<style scoped>
.abp-spinner--overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}
</style>
