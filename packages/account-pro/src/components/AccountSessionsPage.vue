<template>
  <AbpPage title="AbpIdentity::Sessions">
    <p v-if="failed || error" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <form class="d-flex gap-2 flex-wrap align-items-end mb-3" @submit.prevent="applyFilters">
      <AbpFormField v-slot="field" :label="$t('AbpIdentity::Session:Device')"
        ><AbpInput :id="field.id" v-model="device" name="device"
      /></AbpFormField>
      <AbpFormField v-slot="field" :label="$t('AbpIdentity::Session:ClientId')"
        ><AbpInput :id="field.id" v-model="clientId" name="clientId"
      /></AbpFormField>
      <AbpButton type="submit">{{ $t('AbpUi::Search') }}</AbpButton
      ><AbpButton variant="secondary" :disabled="busy" @click="list.getWithoutPageReset()">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </form>
    <div class="table-responsive">
      <table class="table">
        <caption class="visually-hidden">
          {{
            $t('AbpIdentity::Sessions')
          }}
        </caption>
        <thead>
          <tr>
            <th>{{ $t('AbpUi::Actions') }}</th>
            <th v-for="column in columns" :key="column.name">
              <AbpButton variant="secondary" size="sm" @click="sort(column.name)">{{
                $t(column.label)
              }}</AbpButton>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in items" :key="record.id">
            <td>
              <div class="d-flex gap-2">
                <AbpButton :disabled="busy" @click="details(record)">{{
                  $t('AbpIdentity::Details')
                }}</AbpButton
                ><AbpButton
                  variant="danger"
                  :disabled="busy || needsReload"
                  @click="revoke(record)"
                  >{{ $t('AbpUi::Delete') }}</AbpButton
                >
              </div>
            </td>
            <td>
              {{ record.device }}
              <span v-if="isCurrent(record)">{{ $t('AbpIdentity::Session:Current') }}</span>
            </td>
            <td>{{ record.deviceInfo }}</td>
            <td>{{ date(record.signedIn) }}</td>
            <td>{{ date(record.lastAccessed) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <AbpPagination
      :page="list.page.value"
      :page-size="list.maxResultCount.value"
      :total="list.totalCount.value"
      @update:page="list.page.value = $event"
      @update:page-size="list.maxResultCount.value = $event"
    />
    <AbpModal :visible="Boolean(selected)" @update:visible="$event || (selected = undefined)">
      <template #header>{{ $t('AbpIdentity::Session:Detail') }}</template>
      <dl v-if="selected">
        <template v-for="field in detailFields" :key="field.name"
          ><dt>{{ $t(field.label) }}</dt>
          <dd>
            {{
              field.name === 'signedIn' || field.name === 'lastAccessed'
                ? date(selected[field.name])
                : field.name === 'ipAddresses'
                  ? selected.ipAddresses?.join(', ')
                  : selected[field.name]
            }}
          </dd></template
        >
      </dl>
    </AbpModal>
  </AbpPage>
</template>
<script setup lang="ts">
import { AccountSessionService, type IdentitySessionDto } from '@lsw-abpvue/account-pro/proxy';
import { AbpPage } from '@lsw-abpvue/components';
import {
  AuthService,
  ConfigStateService,
  inject as injectAbp,
  useListService,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpPagination,
  ConfirmationStatus,
  useConfirmation,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountOperation } from '../utils/use-account-operation.js';

const service = injectAbp(AccountSessionService);
const config = injectAbp(ConfigStateService);
const auth = injectAbp(AuthService);
const confirmation = useConfirmation();
const router = useRouter();
const list = useListService({ sortKey: 'signedIn', sortOrder: 'desc' });
const device = ref('');
const clientId = ref('');
let filter = { device: '', clientId: '' };
const { busy, failed, needsReload, run } = useAccountOperation();
const { items, error } = list.hookToQuery(async (query, signal) => {
  const result = auth.isAuthenticated.value
    ? await service.getList({ ...query, ...filter }, { signal })
    : { items: [], totalCount: 0 };
  if (!signal.aborted) {
    needsReload.value = false;
    failed.value = false;
  }
  return result;
});
const selected = shallowRef<IdentitySessionDto>();
const columns = [
  { name: 'device', label: 'AbpIdentity::Session:Device' },
  { name: 'deviceInfo', label: 'AbpIdentity::Session:DeviceInfo' },
  { name: 'signedIn', label: 'AbpIdentity::Session:SignedIn' },
  { name: 'lastAccessed', label: 'AbpIdentity::Session:LastAccessed' },
] as const;
const detailFields = [
  ...columns,
  { name: 'clientId', label: 'AbpIdentity::Session:ClientId' },
  { name: 'ipAddresses', label: 'AbpIdentity::Session:IpAddresses' },
  { name: 'userName', label: 'AbpIdentity::Session:UserInfo' },
] as const;
function date(value: string | null | undefined): string {
  return value
    ? new Date(value).toLocaleString(config.snapshot().localization.currentCulture.cultureName)
    : '';
}
function isCurrent(record: IdentitySessionDto): boolean {
  return (
    record.isCurrent ||
    Boolean(record.sessionId && record.sessionId === config.snapshot().currentUser.sessionId)
  );
}
function applyFilters(): void {
  filter = { device: device.value, clientId: clientId.value };
  list.get();
}
function sort(key: string): void {
  list.sortOrder.value =
    list.sortKey.value === key && list.sortOrder.value === 'asc' ? 'desc' : 'asc';
  list.sortKey.value = key;
}
function details(record: IdentitySessionDto): Promise<boolean> {
  const id = record.id;
  return id
    ? run(
        signal => service.get(id, { signal }),
        value => {
          selected.value = { ...value, isCurrent: isCurrent(record) };
        },
      )
    : Promise.resolve(false);
}
async function revoke(record: IdentitySessionDto): Promise<void> {
  const id = record.id;
  if (busy.value || needsReload.value || !id) return;
  const subject = `${config.snapshot().currentTenant.id}:${config.snapshot().currentUser.id}`;
  if (
    (await confirmation.warn(
      'AbpIdentity::SessionLogoutConfirmationMessage',
      'AbpUi::AreYouSure',
    )) !== ConfirmationStatus.confirm ||
    subject !== `${config.snapshot().currentTenant.id}:${config.snapshot().currentUser.id}`
  )
    return;
  const current = isCurrent(record);
  if (
    await run(
      signal => service.revoke(id, { signal }),
      () => {
        selected.value = undefined;
      },
      true,
    )
  ) {
    if (current) {
      if (auth.clearSession) {
        await auth.clearSession();
        await router.replace('/');
      } else await auth.logout();
    } else list.getWithoutPageReset();
  }
}
watch([() => config.snapshot().currentUser.id, () => config.snapshot().currentTenant.id], () => {
  selected.value = undefined;
  items.value = [];
  list.get();
});
</script>
