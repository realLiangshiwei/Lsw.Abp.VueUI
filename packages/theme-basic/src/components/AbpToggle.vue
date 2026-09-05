<script setup lang="ts">
import type { AbpToggleEmits, AbpToggleProps } from '@lsw-abpvue/theme-shared';
import {
  CheckboxIndicator,
  CheckboxRoot,
  Label,
  RadioGroupItem,
  RadioGroupRoot,
  SwitchRoot,
  SwitchThumb,
} from 'reka-ui';
import { computed, useId } from 'vue';
import { defined } from '../utils/defined.js';

const props = withDefaults(defineProps<AbpToggleProps>(), { variant: 'checkbox' });

const emit = defineEmits<AbpToggleEmits>();

const generated = useId();
const controlId = computed(() => props.id ?? generated);
const checked = computed(() => (props.indeterminate ? 'indeterminate' : props.modelValue === true));

const selectedKey = computed(() =>
  props.modelValue === undefined || props.modelValue === null
    ? undefined
    : String(props.modelValue),
);

const byKey = computed(
  () => new Map((props.options ?? []).map(option => [String(option.value), option.value])),
);
</script>

<template>
  <div v-if="variant === 'radio'" class="abp-toggle">
    <RadioGroupRoot
      v-bind="defined({ modelValue: selectedKey, name })"
      :disabled="Boolean(disabled || readonly)"
      :aria-label="ariaLabel ?? label"
      :aria-describedby="ariaDescribedby"
      @update:model-value="emit('update:modelValue', byKey.get(String($event)) ?? null)"
    >
      <div v-for="option in options" :key="String(option.value)" class="form-check">
        <RadioGroupItem
          :id="`${controlId}-${option.value}`"
          class="form-check-input"
          :value="String(option.value)"
          :disabled="Boolean(option.disabled)"
        />
        <Label class="form-check-label" :for="`${controlId}-${option.value}`">
          {{ option.label }}
        </Label>
      </div>
    </RadioGroupRoot>
  </div>

  <div v-else class="form-check" :class="variant === 'switch' ? 'form-switch' : null">
    <SwitchRoot
      v-if="variant === 'switch'"
      :id="controlId"
      class="form-check-input"
      v-bind="defined({ name })"
      :model-value="modelValue === true"
      :disabled="Boolean(disabled || readonly)"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <SwitchThumb />
    </SwitchRoot>

    <CheckboxRoot
      v-else
      :id="controlId"
      class="form-check-input"
      v-bind="defined({ name })"
      :model-value="checked"
      :disabled="Boolean(disabled || readonly)"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      @update:model-value="emit('update:modelValue', $event === true)"
    >
      <CheckboxIndicator />
    </CheckboxRoot>

    <Label v-if="label" class="form-check-label" :for="controlId">{{ label }}</Label>
  </div>
</template>
