<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import type { AbpInputEmits, AbpInputProps } from '@lsw-abpvue/theme-shared';
import { computed, ref, useId } from 'vue';

const props = withDefaults(defineProps<AbpInputProps>(), { type: 'text', rows: 3 });

const emit = defineEmits<AbpInputEmits>();

const localization = useLocalization();
const revealed = ref(false);
const generatedId = useId();
const controlId = computed(() => props.id ?? generatedId);
const revealLabel = computed(() => {
  const key = localization.findKey(
    ['AbpAccount'],
    [revealed.value ? 'HidePassword' : 'ShowPassword'],
  );
  return key ? localization.t(key) : props.ariaLabel || localization.t('AbpAccount::Password');
});
const textarea = computed(() => props.type === 'textarea');
const nativeType = computed(() =>
  props.type === 'password' && revealed.value ? 'text' : props.type,
);

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  emit(
    'update:modelValue',
    props.type === 'number' ? (value === '' ? null : Number(value)) : value,
  );
}
</script>

<template>
  <div :class="revealable && type === 'password' ? 'input-group' : null">
    <textarea
      v-if="textarea"
      :id="controlId"
      :name="name"
      :rows="rows"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      class="form-control"
      :class="invalid ? 'is-invalid' : null"
      @input="onInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />

    <input
      v-else
      :id="controlId"
      :name="name"
      :type="nativeType"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      class="form-control"
      :class="invalid ? 'is-invalid' : null"
      @input="onInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />

    <button
      v-if="revealable && type === 'password'"
      type="button"
      class="btn btn-outline-secondary"
      :aria-label="revealLabel"
      :aria-controls="controlId"
      :aria-pressed="revealed ? 'true' : 'false'"
      @click="revealed = !revealed"
    >
      <i :class="revealed ? 'bi bi-eye-slash' : 'bi bi-eye'" aria-hidden="true" />
    </button>
  </div>
</template>
