<template>
  <AbpInput
    :id="prop.id"
    :model-value="value"
    :disabled="disabled"
    :readonly="readonly"
    autocomplete="off"
    @update:model-value="update"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AbpInput } from '@lsw-abpvue/theme-shared';
import type { FormProp } from '@lsw-abpvue/components';
const props = defineProps<{
  modelValue?: unknown;
  prop: FormProp;
  record: unknown;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const value = computed(() => String(props.modelValue ?? ''));
function update(value: string | number | null): void {
  emit('update:modelValue', String(value ?? '').toUpperCase());
}
</script>
