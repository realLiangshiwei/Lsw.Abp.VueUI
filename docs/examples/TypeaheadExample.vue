<template>
  <AbpFormField v-slot="{ id }" label="Author" hint="Type at least two characters, such as Au">
    <AbpTypeahead
      :id="id"
      v-model="authorId"
      v-model:display-value="authorName"
      :search="search"
      :min-length="2"
      :debounce="300"
      clearable
    >
      <template #item="{ item }"
        ><strong>{{ item.label }}</strong></template
      >
      <template #empty>No matching author</template>
    </AbpTypeahead>
  </AbpFormField>
  <output>Value sent to the API: {{ authorId ?? 'none' }}; display: {{ authorName }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpFormField, AbpTypeahead, type AbpTypeaheadItem } from '@lsw-abpvue/theme-shared';
const authorId = ref<string | null>('austen');
const authorName = ref('Jane Austen');
const authors: AbpTypeaheadItem[] = [
  { value: 'austen', label: 'Jane Austen' },
  { value: 'orwell', label: 'George Orwell' },
];
async function search(term: string, signal: AbortSignal): Promise<readonly AbpTypeaheadItem[]> {
  signal.throwIfAborted();
  // For a backend lookup, forward signal to RestService's request configuration.
  return authors.filter(item => item.label.toLowerCase().includes(term.toLowerCase()));
}
</script>
