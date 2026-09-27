<script setup lang="ts">
import type { AbpDatePickerEmits, AbpDatePickerProps } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';

const props = withDefaults(defineProps<AbpDatePickerProps>(), { type: 'date' });

const emit = defineEmits<AbpDatePickerEmits>();

/**
 * Stage one of design 06 §3: a native control. It looks different in every browser and it
 * works in all of them, which is the right trade while the contract is what matters.
 */
const NATIVE_TYPE = { date: 'date', time: 'time', datetime: 'datetime-local' } as const;

const nativeType = computed(() => NATIVE_TYPE[props.type]);

function nativeValue(value: string | null | undefined): string {
  const text = value ?? '';
  if (props.type === 'date') return text.split('T')[0] ?? '';

  const local = text.replace(/(?:Z|[+-]\d{2}:\d{2})$/, '').replace(/(\.\d{3})\d+$/, '$1');

  return props.type === 'time' ? (local.split('T').at(-1) ?? '') : local;
}
</script>

<template>
  <div :class="clearable ? 'input-group' : null">
    <input
      :id="id"
      :name="name"
      :type="nativeType"
      :value="nativeValue(modelValue)"
      :min="min ? nativeValue(min) : undefined"
      :max="max ? nativeValue(max) : undefined"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      class="form-control"
      :class="invalid ? 'is-invalid' : null"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value || null)"
    />

    <button
      v-if="clearable"
      type="button"
      class="btn btn-outline-secondary"
      :disabled="disabled"
      :aria-label="$t('AbpUi::Clear')"
      @click="emit('update:modelValue', null)"
    >
      <i class="bi bi-x-lg" aria-hidden="true" />
    </button>
  </div>
</template>
