<template>
  <AbpPage title="BookStore::Books">
    <AbpDataTable
      v-model:sort-key="list.sortKey.value"
      v-model:sort-order="list.sortOrder.value"
      :columns="columns"
      :data="items"
      record-key="id"
      :loading="list.requestStatus.value === 'loading'"
    />
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
      <span>{{ localization.t('AbpUi::PagerInfo', first, last, totalCount) }}</span>
      <AbpPagination
        v-model:page="list.page.value"
        v-model:page-size="list.maxResultCount.value"
        :total="totalCount"
      />
    </div>
  </AbpPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AbpDataTable, AbpPage, type AbpTableColumn } from '@lsw-abpvue/components';
import {
  inject,
  RestService,
  useListService,
  useLocalization,
  type PagedResultDto,
} from '@lsw-abpvue/core';
import { AbpPagination } from '@lsw-abpvue/theme-shared';

interface Book {
  id: string;
  name: string;
}
const rest = inject(RestService);
const localization = useLocalization();
const list = useListService({ persistKey: 'BookStore.Books' });
const { items, totalCount } = list.hookToQuery((query, signal) =>
  rest.request<never, PagedResultDto<Book>>(
    { method: 'GET', url: '/api/app/book', params: { ...query } },
    { signal },
  ),
);
const columns = computed<AbpTableColumn<Book>[]>(() => [
  { id: 'name', header: localization.t('AbpIdentity::DisplayName:Name'), sortable: true },
]);
const first = computed(() =>
  totalCount.value ? list.page.value * list.maxResultCount.value + 1 : 0,
);
const last = computed(() =>
  Math.min((list.page.value + 1) * list.maxResultCount.value, totalCount.value),
);
</script>
