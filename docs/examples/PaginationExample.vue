<template>
  <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
    <span aria-live="polite">Showing {{ first }} to {{ last }} of {{ total }} entries</span>
    <AbpPagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[5, 10, 25]"
      show-size-selector
      aria-label="Books pagination"
    />
  </div>
  <output>API skipCount: {{ page * pageSize }}; maxResultCount: {{ pageSize }}</output>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AbpPagination } from '@lsw-abpvue/theme-shared';
const total = 47;
const page = ref(0);
const pageSize = ref(5);
watch(pageSize, () => {
  page.value = 0;
});
const first = computed(() => (total ? page.value * pageSize.value + 1 : 0));
const last = computed(() => Math.min((page.value + 1) * pageSize.value, total));
</script>
