<script setup lang="ts">
import type { AbpFormFieldProps, AbpFormFieldSlots } from '@lsw-abpvue/theme-shared';
import { computed, useId } from 'vue';

const props = withDefaults(defineProps<AbpFormFieldProps>(), { errors: () => [] });

defineSlots<AbpFormFieldSlots>();

const generated = useId();
const controlId = computed(() => props.for ?? generated);
const hintId = computed(() => `${controlId.value}-hint`);
const errorsId = computed(() => `${controlId.value}-errors`);
const invalid = computed(() => props.errors.length > 0);

const describedBy = computed(() => {
  const ids = [props.hint ? hintId.value : null, invalid.value ? errorsId.value : null];
  return ids.filter(Boolean).join(' ') || undefined;
});
</script>

<template>
  <div class="mb-3">
    <label v-if="label || $slots.label" class="form-label" :for="controlId">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="text-danger ms-1" aria-hidden="true">*</span>
    </label>

    <slot :id="controlId" :described-by="describedBy" :invalid="invalid" />

    <div v-if="hint || $slots.hint" :id="hintId" class="form-text">
      <slot name="hint">{{ hint }}</slot>
    </div>

    <slot v-if="invalid" name="errors" :errors="errors">
      <ul :id="errorsId" class="invalid-feedback d-block list-unstyled mb-0">
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </slot>
  </div>
</template>
