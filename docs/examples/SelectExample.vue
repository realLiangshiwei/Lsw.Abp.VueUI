<template>
  <AbpFormField v-slot="{ id }" label="Category">
    <AbpSelect
      :id="id"
      v-model="category"
      :options="options"
      placeholder="Choose a category"
      clearable
    >
      <template #option="{ option, selected }"
        ><span>{{ selected ? '✓ ' : '' }}{{ option.label }}</span></template
      >
    </AbpSelect>
  </AbpFormField>
  <AbpFormField v-slot="{ id }" label="Several categories">
    <AbpSelect :id="id" v-model="categories" :options="options" multiple clearable />
  </AbpFormField>
  <output>Single: {{ category ?? 'none' }}; multiple: {{ categories.join(', ') || 'none' }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpFormField, AbpSelect, type AbpOption } from '@lsw-abpvue/theme-shared';
const category = ref<string | null>(null);
const categories = ref<string[]>([]);
const options: AbpOption[] = [
  { value: 'fiction', label: 'Fiction', group: 'Books' },
  { value: 'science', label: 'Science', group: 'Books' },
  { value: 'archived', label: 'Archived', disabled: true },
];
</script>
