<template>
  <AbpPage v-if="allowed" title="TextTemplateManagement::Menu:TextTemplates">
    <template #toolbar><AbpPageToolbar :key="context" :data="items" /></template>
    <AbpExtensibleTable
      :key="context"
      :data="items"
      :list="list"
      record-key="name"
      searchable
      caption="TextTemplateManagement::Menu:TextTemplates"
      actions-text="AbpUi::Actions"
    />
    <p v-if="error" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
  </AbpPage>
</template>

<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  EXTENSIONS_IDENTIFIER,
} from '@lsw-abpvue/components';
import { inject, provideAbp, useListService } from '@lsw-abpvue/core';
import { TextTemplateManagementPolicyNames as Policy } from '@lsw-abpvue/text-template-management/config';
import {
  TemplateDefinitionService,
  type TemplateDefinitionDto,
} from '@lsw-abpvue/text-template-management/proxy';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { TextTemplateManagementComponents as Keys } from '../enums/components.js';
import { textTemplateManagementExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { TEXT_TEMPLATES_PAGE } from '../tokens/pages.token.js';
import { useTextTemplateManagement } from '../utils/use-text-template-management.js';

const service = inject(TemplateDefinitionService);
const router = useRouter();
const state = useTextTemplateManagement();
const { allowed, context, permission } = state;
const list = useListService({ persistKey: Keys.TextTemplates });
const { items, error } = list.hookToQuery(async ({ filter: filterText, ...query }, signal) => {
  if (!allowed.value) return { items: [], totalCount: 0 };
  const own = AbortSignal.any([signal, state.signal()]);
  const result = await service.getList({ ...query, filterText }, { signal: own });
  return own.aborted ? { items: [], totalCount: 0 } : result;
});
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: Keys.TextTemplates },
  { provide: TEXT_TEMPLATES_PAGE, useValue: { editContents } },
]);
injector.runInContext(textTemplateManagementExtensionsResolver);

function editContents(record: TemplateDefinitionDto): void {
  if (!allowed.value || !permission.isGranted(Policy.EditContents) || !record.name) return;
  const mode = record.isInlineLocalized ? 'inline/' : '';
  void router.push(
    `/text-template-management/text-templates/contents/${mode}${encodeURIComponent(record.name)}`,
  );
}

watch(
  context,
  () => {
    items.value = [];
    error.value = null;
    list.totalCount.value = 0;
    injector.runInContext(textTemplateManagementExtensionsResolver);
    list.get();
  },
  { flush: 'sync' },
);
</script>
