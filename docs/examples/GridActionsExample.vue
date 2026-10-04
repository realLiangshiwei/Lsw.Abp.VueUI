<template>
  <div class="d-flex flex-wrap gap-4 align-items-center">
    <div>
      <p>Several actions</p>
      <AbpGridActions :record="book" :actions="actions" />
    </div>
    <div>
      <p>One action</p>
      <AbpGridActions :record="book" :actions="actions.slice(0, 1)" />
    </div>
    <div>
      <p>No actions</p>
      <AbpGridActions :record="book" :actions="[]" />
    </div>
  </div>
  <output aria-live="polite">{{ result }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpGridActions, type RowAction } from '@lsw-abpvue/components';
interface Book {
  id: string;
  name: string;
}
const book: Book = { id: '1', name: '1984' };
const result = ref('Choose an action');
const actions: RowAction<Book>[] = [
  {
    text: 'Edit',
    icon: 'bi bi-pencil',
    action: record => {
      result.value = `Edit ${record.name}`;
    },
  },
  {
    text: 'Archive',
    action: record => {
      result.value = `Archive ${record.id}`;
    },
  },
];
</script>
