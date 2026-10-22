<template>
  <AbpPage title="AbpAccount::MySecurityLogs">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <form class="row mb-3" @submit.prevent="search">
      <AbpFormField v-slot="control" class="col-md-4" :label="$t('AbpAccount::StartTime')"
        ><AbpDatePicker :id="control.id" v-model="draft.startTime" type="datetime" clearable
      /></AbpFormField>
      <AbpFormField v-slot="control" class="col-md-4" :label="$t('AbpAccount::EndTime')"
        ><AbpDatePicker :id="control.id" v-model="draft.endTime" type="datetime" clearable
      /></AbpFormField>
      <AbpFormField
        v-slot="control"
        class="col-md-4"
        :label="$t('AbpAccount::MySecurityLogs:Action')"
        ><AbpInput :id="control.id" v-model="draft.action" name="action"
      /></AbpFormField>
      <p v-if="invalidRange" role="alert">{{ $t('AbpUi::ValidationErrorMessage') }}</p>
      <div class="d-flex gap-2">
        <AbpButton type="submit">{{ $t('AbpUi::Search') }}</AbpButton
        ><AbpButton variant="secondary" @click="clear">{{ $t('AbpUi::Clear') }}</AbpButton>
      </div>
    </form>
    <p v-if="error" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
      $t('AbpUi::Refresh')
    }}</AbpButton>
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpAccount::MySecurityLogs"
    />
  </AbpPage>
</template>
<script setup lang="ts">
import {
  AccountService,
  type GetIdentitySecurityLogListInput,
} from '@lsw-abpvue/account-pro/proxy';
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  EXTENSIONS_IDENTIFIER,
} from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject as injectAbp,
  provideAbp,
  useListService,
} from '@lsw-abpvue/core';
import { AbpButton, AbpDatePicker, AbpFormField, AbpInput } from '@lsw-abpvue/theme-shared';
import { computed, reactive, watch } from 'vue';
import { AccountProComponents } from '../enums/components.js';
import { ACCOUNT_PRO_SECURITY_LOGS_PAGE } from '../tokens/config-options.token.js';

const service = injectAbp(AccountService);
const config = injectAbp(ConfigStateService);
const list = useListService({
  sortKey: 'creationTime',
  sortOrder: 'desc',
  persistKey: AccountProComponents.MySecurityLogs,
});
const draft = reactive({ startTime: '', endTime: '', action: '' });
let filters: GetIdentitySecurityLogListInput = {};
const { items, error } = list.hookToQuery((query, signal) =>
  service.getSecurityLogList({ ...query, ...filters }, { signal }),
);
const invalidRange = computed(() =>
  Boolean(
    (draft.startTime && !Number.isFinite(Date.parse(draft.startTime))) ||
    (draft.endTime && !Number.isFinite(Date.parse(draft.endTime))) ||
    (draft.startTime && draft.endTime && Date.parse(draft.startTime) > Date.parse(draft.endTime)),
  ),
);
function search(): void {
  if (invalidRange.value) return;
  filters = {
    startTime: draft.startTime || undefined,
    endTime: draft.endTime || undefined,
    action: draft.action || undefined,
  };
  list.get();
}
function clear(): void {
  Object.assign(draft, { startTime: '', endTime: '', action: '' });
  search();
}
provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: AccountProComponents.MySecurityLogs },
  {
    provide: ACCOUNT_PRO_SECURITY_LOGS_PAGE,
    useValue: {
      filterAction(value: string | undefined): void {
        draft.action = value ?? '';
        search();
      },
    },
  },
]);
watch([() => config.snapshot().currentUser.id, () => config.snapshot().currentTenant.id], () => {
  items.value = [];
  clear();
});
</script>
