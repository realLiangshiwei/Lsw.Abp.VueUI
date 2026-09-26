<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  useRecordEditor,
} from '@lsw-abpvue/components';
import {
  inject as injectAbp,
  RestService,
  useListService,
  type PagedAndSortedResultRequestDto,
  type PagedResultDto,
} from '@lsw-abpvue/core';
import { SampleComponents } from '../enums/components.js';
import type { SampleDto } from '../models/sample.js';
import { SAMPLE_PAGE } from '../tokens/extensions.token.js';

/**
 * The module's page. It talks to the backend through `RestService` so the package
 * compiles before a proxy has been generated; once `abpv proxy add` has run, inject the
 * generated service instead and delete these four requests.
 */
const rest = injectAbp(RestService);

const request = <T,>(
  method: string,
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> => rest.request<unknown, T>({ method, url, body, params }, { apiName: 'Default' });

const list = useListService({ persistKey: SampleComponents.Sample });
const { items } = list.hookToQuery((query: PagedAndSortedResultRequestDto) =>
  request<PagedResultDto<SampleDto>>('GET', '/api/sample', undefined, {
    sorting: query.sorting,
    skipCount: query.skipCount,
    maxResultCount: query.maxResultCount,
  }),
);

const editor = useRecordEditor<SampleDto>({
  identifier: SampleComponents.Sample,
  reload: () => list.get(),
  create: body => request<SampleDto>('POST', '/api/sample', body),
  update: (id, body) => request<SampleDto>('PUT', `/api/sample/${id}`, body),
  delete: id => request<void>('DELETE', `/api/sample/${id}`),
  idOf: record => record.id,
  nameOf: record => record.name ?? '',
  deletionMessage: 'Sample::DeletionConfirmationMessage',
  providers: [
    {
      provide: SAMPLE_PAGE,
      useValue: {
        add: () => editor.show(),
        edit: (record: SampleDto) => editor.show(record),
        remove: (record: SampleDto) => editor.remove(record),
      },
    },
  ],
});
</script>

<template>
  <AbpPage title="Sample::Menu:Sample">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>

    <AbpExtensibleTable :data="items" :list="list" record-key="id" caption="Sample::Menu:Sample" />

    <AbpRecordModal :editor="editor" label="Sample::Menu:Sample" create-title="AbpUi::NewRecord" />
  </AbpPage>
</template>
