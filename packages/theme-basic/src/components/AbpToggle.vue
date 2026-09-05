<script setup lang="ts">
import type { AbpToggleEmits, AbpToggleProps } from '@lsw-abpvue/theme-shared';
import { computed, useId, useTemplateRef, watchEffect } from 'vue';

const props = withDefaults(defineProps<AbpToggleProps>(), { variant: 'checkbox' });

const emit = defineEmits<AbpToggleEmits>();

const generated = useId();
const controlId = computed(() => props.id ?? generated);

/**
 * Native inputs rather than reka-ui. The rule is to outsource behaviour we would get
 * wrong -- focus traps, popover placement, roving tabindex -- and a checkbox has none of
 * that: the native one is already the accessible primitive, and it is the one Bootstrap
 * knows how to draw.
 */
function onCheckedChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
}

// Neither checked nor unchecked is a property, not an attribute, so it cannot be bound.
const control = useTemplateRef<HTMLInputElement>('control');
watchEffect(() => {
  if (control.value) control.value.indeterminate = props.indeterminate === true;
});
</script>

<template>
  <fieldset v-if="variant === 'radio'" class="border-0 p-0 m-0">
    <legend v-if="label" class="form-label fs-6">{{ label }}</legend>

    <div v-for="option in options" :key="String(option.value)" class="form-check">
      <input
        :id="`${controlId}-${option.value}`"
        class="form-check-input"
        type="radio"
        :name="name ?? controlId"
        :value="String(option.value)"
        :checked="modelValue === option.value"
        :disabled="disabled || readonly || option.disabled"
        :aria-invalid="invalid ? 'true' : undefined"
        :aria-describedby="ariaDescribedby"
        @change="emit('update:modelValue', option.value)"
      />
      <label class="form-check-label" :for="`${controlId}-${option.value}`">
        {{ option.label }}
      </label>
    </div>
  </fieldset>

  <div v-else class="form-check" :class="variant === 'switch' ? 'form-switch' : null">
    <input
      :id="controlId"
      ref="control"
      class="form-check-input"
      type="checkbox"
      :role="variant === 'switch' ? 'switch' : undefined"
      :name="name"
      :checked="modelValue === true"
      :disabled="disabled || readonly"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      @change="onCheckedChange"
    />
    <label v-if="label" class="form-check-label" :for="controlId">{{ label }}</label>
  </div>
</template>
