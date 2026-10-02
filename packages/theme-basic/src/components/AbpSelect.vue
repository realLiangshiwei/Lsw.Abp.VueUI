<script setup lang="ts">
import type {
  AbpOptionValue,
  AbpSelectEmits,
  AbpSelectProps,
  AbpSelectSlots,
} from '@lsw-abpvue/theme-shared';
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui';
import { computed } from 'vue';
import { useDirection } from '../services/direction.service.js';
import { defined } from '../utils/defined.js';

const props = defineProps<AbpSelectProps>();

const emit = defineEmits<AbpSelectEmits>();
defineSlots<AbpSelectSlots>();
const { direction } = useDirection();

/**
 * reka-ui keys its items by the value it is given, and `null` is not a key. Options are
 * addressed by their string form and mapped back on the way out, which also keeps a
 * numeric enum member a number rather than the string the DOM would have made of it.
 */
const byKey = computed(
  () => new Map(props.options.map(option => [String(option.value), option.value])),
);

const selectedKey = computed(() =>
  props.multiple
    ? (props.modelValue as readonly AbpOptionValue[] | undefined)?.map(String)
    : props.modelValue === undefined || props.modelValue === null
      ? undefined
      : String(props.modelValue),
);

const selectedLabel = computed(() => {
  const keys = new Set(
    props.multiple ? (selectedKey.value as string[] | undefined) : [selectedKey.value],
  );

  return props.options
    .filter(option => keys.has(String(option.value)))
    .map(option => option.label)
    .join(', ');
});

function onChange(next: unknown): void {
  if (props.multiple) {
    const keys = Array.isArray(next) ? (next as string[]) : [];
    emit(
      'update:modelValue',
      keys.map(key => byKey.value.get(key) ?? null),
    );
    return;
  }

  emit('update:modelValue', byKey.value.get(String(next)) ?? null);
}
</script>

<template>
  <SelectRoot
    v-bind="defined({ modelValue: selectedKey, multiple, name })"
    :dir="direction"
    :disabled="Boolean(disabled || readonly)"
    @update:model-value="onChange"
  >
    <SelectTrigger
      :id="id"
      class="abp-select__trigger form-select"
      :class="invalid ? 'is-invalid' : null"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
    >
      <SelectValue :placeholder="placeholder ?? ''">{{ selectedLabel }}</SelectValue>
    </SelectTrigger>

    <!-- Portalled to `body`, which is why `.abp-select__content` is styled in the
         theme's stylesheet rather than in a scoped block here: the scope attribute lands
         on reka-ui's popper wrapper, not on the list. -->
    <SelectPortal>
      <SelectContent class="abp-select__content dropdown-menu show" position="popper">
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="String(option.value)"
            class="dropdown-item d-flex justify-content-between"
            :value="String(option.value)"
            :disabled="Boolean(option.disabled)"
          >
            <SelectItemText>
              <slot name="option" :option="option" :selected="String(option.value) === selectedKey">
                {{ option.label }}
              </slot>
            </SelectItemText>
            <SelectItemIndicator>
              <i class="bi bi-check" aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
