<template>
  <AbpPage title="Books">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <AbpExtensibleTable :data="items" :list="list" record-key="id" searchable />
    <AbpRecordModal
      :editor="editor"
      :label="{ key: 'Catalog::Books', defaultValue: 'Books' }"
      :create-title="{ key: 'Catalog::NewBook', defaultValue: 'New book' }"
    />
  </AbpPage>
</template>

<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  useRecordEditor,
  type RecordEditor,
} from '@lsw-abpvue/components';
import { inject, RestService, useListService, type PagedResultDto } from '@lsw-abpvue/core';
import { onBeforeUnmount, ref } from 'vue';
import { CATALOG_PAGE, catalogKey, type CatalogBook as Book } from './catalog-extensions';

const rest = inject(RestService);
const request = new AbortController();
const loadingDetail = ref(false);
onBeforeUnmount(() => request.abort());
const list = useListService({ persistKey: catalogKey });
const { items } = list.hookToQuery((query, signal) =>
  rest.request<never, PagedResultDto<Book>>(
    { method: 'GET', url: '/api/app/documentation-catalog', params: { ...query } },
    { signal },
  ),
);
const editor: RecordEditor<Book> = useRecordEditor<Book>({
  identifier: catalogKey,
  providers: [
    {
      provide: CATALOG_PAGE,
      useValue: {
        add: () => editor.show(),
        edit: editBook,
        remove: (record: Book) => editor.remove(record),
      },
    },
  ],
  reload: () => list.getWithoutPageReset(),
  create: body =>
    rest.request(
      { method: 'POST', url: '/api/app/documentation-catalog', body },
      { signal: request.signal },
    ),
  update: (id, body) =>
    rest.request(
      {
        method: 'PUT',
        url: `/api/app/documentation-catalog/${id}`,
        body: { ...editor.editing.value, ...body },
      },
      { signal: request.signal },
    ),
  delete: id =>
    rest.request(
      { method: 'DELETE', url: `/api/app/documentation-catalog/${id}` },
      { signal: request.signal },
    ),
  idOf: record => record.id,
  stampOf: record => record.concurrencyStamp,
  nameOf: record => record.name,
  deletionMessage: { key: 'Catalog::DeleteBook', defaultValue: 'Delete {0}?' },
});

async function editBook(record: Book): Promise<void> {
  if (loadingDetail.value || editor.busy.value) return;
  loadingDetail.value = true;
  try {
    const detail = await rest.request<never, Book>(
      { method: 'GET', url: `/api/app/documentation-catalog/${record.id}` },
      { signal: request.signal },
    );
    if (!request.signal.aborted) editor.show(detail);
  } catch {
    /* Request handlers report failure; keep the incomplete editor closed. */
  } finally {
    loadingDetail.value = false;
  }
}
</script>
