<template>
  <AbpPage title="AbpIdentity::SecurityLogs">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <form
      class="mb-3"
      novalidate
      :aria-label="localization.t('AbpIdentity::Filters')"
      @submit.prevent="apply"
    >
      <fieldset :disabled="!allowed">
        <div class="row">
          <AbpFormField
            v-for="field in dates"
            :key="field.name"
            v-slot="control"
            class="col-12 col-md-6"
            :label="localization.t(field.label)"
            :errors="invalidDate ? [invalidRangeText] : []"
            ><AbpDatePicker
              :id="control.id"
              v-model="draft[field.name]"
              type="datetime"
              :name="field.name"
              :invalid="control.invalid"
              :aria-describedby="control.describedBy"
              clearable
          /></AbpFormField>
          <AbpFormField
            v-for="field in textFields"
            :key="field.name"
            v-slot="control"
            class="col-12 col-md-6 col-lg-3"
            :label="localization.t(field.label)"
            ><AbpInput :id="control.id" v-model="draft[field.name]" :name="field.name"
          /></AbpFormField>
        </div>
        <div class="d-flex gap-2">
          <AbpButton variant="secondary" @click="clear">{{
            localization.t('AbpUi::Clear')
          }}</AbpButton
          ><AbpButton variant="primary" type="submit">{{
            localization.t('AbpUi::Search')
          }}</AbpButton>
        </div>
      </fieldset>
    </form>
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpIdentity::SecurityLogs"
    />
    <p v-if="failed" role="alert">
      {{ failureText
      }}<AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <SecurityLogDetailsDialog
      v-if="selected?.id"
      :log-id="selected.id"
      @close="selected = undefined"
    />
  </AbpPage>
</template>
<script setup lang="ts">
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
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  IdentitySecurityLogService,
  type GetIdentitySecurityLogListInput,
  type IdentitySecurityLogDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { AbpButton, AbpDatePicker, AbpFormField, AbpInput } from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IDENTITY_PRO_SECURITY_LOGS_PAGE,
  type IdentitySecurityLogFilterField,
} from '../tokens/security-logs-page.token.js';
import SecurityLogDetailsDialog from './SecurityLogDetailsDialog.vue';
const service = injectAbp(IdentitySecurityLogService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const route = useRoute();
const router = useRouter();
const dates = [
  { name: 'startTime', label: 'AbpIdentity::StartTime' },
  { name: 'endTime', label: 'AbpIdentity::EndTime' },
] as const;
const textFields = [
  { name: 'applicationName', label: 'AbpIdentity::SecurityLogs:Application' },
  { name: 'identity', label: 'AbpIdentity::SecurityLogs:Identity' },
  { name: 'userName', label: 'AbpIdentity::SecurityLogs:UserName' },
  { name: 'action', label: 'AbpIdentity::SecurityLogs:Action' },
  { name: 'clientId', label: 'AbpIdentity::SecurityLogs:Client' },
  { name: 'correlationId', label: 'AbpIdentity::SecurityLogs:CorrelationId' },
  { name: 'clientIpAddress', label: 'AbpIdentity::SecurityLogs:IpAddress' },
] as const;
const draft = reactive<Record<string, string>>({});
if (typeof route.query.userName === 'string') draft.userName = route.query.userName;
const applied = shallowRef<GetIdentitySecurityLogListInput>({ userName: draft.userName });
const list = useListService({
  persistKey: 'Identity.SecurityLogs',
  sortKey: 'creationTime',
  sortOrder: 'desc',
});
const failed = ref(false);
const invalidDate = ref(false);
const selected = shallowRef<IdentitySecurityLogDto>();
let revision = 0;
let controller = new AbortController();
const allowed = computed(() => permission.isGranted('AbpIdentity.SecurityLogs'));
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    allowed.value,
  ]),
);
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const invalidRangeText = computed(() => localization.t('AbpValidation::ThisFieldIsNotValid.'));
provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: 'Identity.SecurityLogs' },
  { provide: IDENTITY_PRO_SECURITY_LOGS_PAGE, useValue: { filter, viewDetails } },
]);
const { items } = list.hookToQuery(async (query, signal) => {
  if (!allowed.value) return { items: [], totalCount: 0 };
  const own = revision;
  const requestSignal = AbortSignal.any([signal, controller.signal]);
  try {
    const result = await service.getList(
      { ...query, ...applied.value },
      { signal: requestSignal, skipHandleError: true },
    );
    if (own !== revision || requestSignal.aborted) return { items: [], totalCount: 0 };
    failed.value = false;
    return result;
  } catch (error) {
    if (own === revision && !requestSignal.aborted) failed.value = true;
    throw error;
  }
});
function apply(): void {
  if (!allowed.value) return;
  const start = draft.startTime ? Date.parse(draft.startTime) : undefined;
  const end = draft.endTime ? Date.parse(draft.endTime) : undefined;
  invalidDate.value =
    (start !== undefined && !Number.isFinite(start)) ||
    (end !== undefined && !Number.isFinite(end)) ||
    (start !== undefined && end !== undefined && start > end);
  if (invalidDate.value) return;
  applied.value = Object.fromEntries(
    [...dates, ...textFields]
      .filter(field => draft[field.name])
      .map(field => [field.name, draft[field.name]]),
  );
  list.get();
  void router.replace({ query: { ...route.query, userName: draft.userName || undefined } });
}
function clear(): void {
  for (const name of Object.keys(draft)) delete draft[name];
  apply();
}
function filter(name: IdentitySecurityLogFilterField, value: string | undefined): void {
  if (!allowed.value) return;
  draft[name] = value ?? '';
  apply();
}
function viewDetails(record: IdentitySecurityLogDto): void {
  if (allowed.value && record.id) selected.value = record;
}
function reset(): void {
  revision += 1;
  controller.abort();
  controller = new AbortController();
  items.value = [];
  list.totalCount.value = 0;
  selected.value = undefined;
  failed.value = false;
}
watch(
  () => route.query.userName,
  value => {
    const next = typeof value === 'string' ? value : '';
    if (next !== (applied.value.userName ?? '')) {
      draft.userName = next;
      apply();
    }
  },
);
watch(
  context,
  () => {
    reset();
    clear();
  },
  { flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
