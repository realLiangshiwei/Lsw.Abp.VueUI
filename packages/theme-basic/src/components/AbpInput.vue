<script setup lang="ts">
import type { AbpInputEmits, AbpInputProps } from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<AbpInputProps>(), { type: 'text', rows: 3 });

const emit = defineEmits<AbpInputEmits>();

const revealed = ref(false);
const textarea = computed(() => props.type === 'textarea');
const nativeType = computed(() =>
  props.type === 'password' && revealed.value ? 'text' : props.type,
);

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', props.type === 'number' ? Number(value) : value);
}
</script>

<template>
  <div :class="revealable && type === 'password' ? 'input-group' : null">
    <textarea
      v-if="textarea"
      :id="id"
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
      :id="id"
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
      :aria-label="revealed ? $t('AbpAccount::HidePassword') : $t('AbpAccount::ShowPassword')"
      :aria-pressed="revealed ? 'true' : 'false'"
      @click="revealed = !revealed"
    >
      <i :class="revealed ? 'bi bi-eye-slash' : 'bi bi-eye'" aria-hidden="true" />
    </button>
  </div>
</template>
