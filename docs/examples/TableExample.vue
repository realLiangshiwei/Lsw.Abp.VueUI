<template>
  <AbpDataTable
    v-model:sort-key="sortKey"
    v-model:sort-order="sortOrder"
    v-model:selected="selected"
    v-model:expanded="expanded"
    :columns="columns"
    :data="sorted"
    record-key="id"
    selectable
    expandable
  >
    <template #cell-price="{ value }">{{ Number(value).toFixed(2) }} USD</template>
    <template #expanded-row="{ row }"
      >{{ row.name }} — stock is tracked by this record's id.</template
    >
    <template #empty>No books match your filters.</template>
  </AbpDataTable>
  <output
    >Selected ids: {{ selected.join(', ') || 'none' }}; sorting: {{ sortKey }}
    {{ sortOrder }}</output
  >
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { AbpDataTable, type AbpTableColumn } from '@lsw-abpvue/components';
interface Book {
  id: string;
  name: string;
  price: number;
}
const books: Book[] = [
  { id: '1', name: 'Pride and Prejudice', price: 12 },
  { id: '2', name: '1984', price: 10 },
];
const columns: AbpTableColumn<Book>[] = [
  { id: 'name', header: 'Name', sortable: true },
  { id: 'price', header: 'Price', sortable: true },
];
const sortKey = ref('name');
const sortOrder = ref<'asc' | 'desc' | ''>('asc');
const selected = ref<string[]>([]);
const expanded = ref<string[]>([]);
const sorted = computed(() =>
  !sortKey.value || !sortOrder.value
    ? books
    : [...books].sort((a, b) => {
        const comparison =
          sortKey.value === 'price' ? a.price - b.price : a.name.localeCompare(b.name);
        return sortOrder.value === 'asc' ? comparison : -comparison;
      }),
);
</script>
