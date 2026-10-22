<template>
  <AbpSelect
    v-if="valueType === 2"
    :id="id"
    :model-value="modelValue"
    :options="booleanOptions"
    :name="name"
    :disabled="disabled"
    :invalid="invalid"
    :aria-describedby="ariaDescribedby"
    @update:model-value="update"
  />
  <AbpDatePicker
    v-else-if="valueType === 3"
    :id="id"
    :model-value="modelValue"
    type="datetime"
    :name="name"
    :disabled="disabled"
    :invalid="invalid"
    :aria-describedby="ariaDescribedby"
    @update:model-value="update"
  />
  <AbpInput
    v-else
    :id="id"
    :model-value="modelValue"
    :type="valueType === 1 ? 'number' : 'text'"
    :name="name"
    :disabled="disabled"
    :invalid="invalid"
    :aria-describedby="ariaDescribedby"
    @update:model-value="update"
    @keydown="blockExponent"
  />
</template>

<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import { AbpDatePicker, AbpInput, AbpSelect } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string | undefined;
  valueType: 0 | 1 | 2 | 3;
  id?: string | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  ariaDescribedby?: string | undefined;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const localization = useLocalization();
const booleanOptions = computed(() => [
  { value: 'true', label: localization.t('AbpIdentity::True') },
  { value: 'false', label: localization.t('AbpIdentity::False') },
]);

function update(value: unknown): void {
  emit('update:modelValue', value === undefined || value === null ? '' : String(value));
}

function blockExponent(event: KeyboardEvent): void {
  if (props.valueType === 1 && (event.key === 'e' || event.key === 'E')) event.preventDefault();
}
</script>
