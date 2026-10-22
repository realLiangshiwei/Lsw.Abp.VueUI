<template>
  <AbpModal :visible="true" size="xl" :busy="busy" @update:visible="$event || emit('close')">
    <template #header
      >{{ localization.t('AbpIdentity::Sessions')
      }}<template v-if="displayName">: {{ displayName }}</template></template
    >
    <AbpSpinner v-if="list.requestStatus.value === 'loading'" />
    <div v-if="failed" role="alert">
      <p>{{ failureText }}</p>
      <AbpButton variant="secondary" :disabled="busy" @click="refresh">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <form
      class="mb-3"
      :aria-label="localization.t('AbpIdentity::Filters')"
      @submit.prevent="applyFilters"
    >
      <fieldset :disabled="busy || !allowed" class="d-flex gap-2 flex-wrap align-items-end">
        <AbpFormField v-slot="control" :label="localization.t('AbpIdentity::Session:Device')"
          ><AbpInput :id="control.id" v-model="filterDraft.device" name="device"
        /></AbpFormField>
        <AbpFormField v-slot="control" :label="localization.t('AbpIdentity::Session:ClientId')"
          ><AbpInput :id="control.id" v-model="filterDraft.clientId" name="clientId"
        /></AbpFormField>
        <AbpButton variant="primary" type="submit">{{ localization.t('AbpUi::Search') }}</AbpButton>
        <AbpButton variant="secondary" @click="clearFilters">{{
          localization.t('AbpUi::Clear')
        }}</AbpButton>
      </fieldset>
    </form>
    <div class="table-responsive">
      <table class="table table-striped">
        <caption class="visually-hidden">
          {{
            localization.t('AbpIdentity::Sessions')
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ localization.t('AbpUi::Actions') }}</th>
            <th
              v-for="column in columns"
              :key="column.name"
              scope="col"
              :aria-sort="
                list.sortKey.value === column.name
                  ? list.sortOrder.value === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              "
            >
              <AbpButton
                variant="secondary"
                outline
                size="sm"
                :disabled="busy"
                @click="sort(column.name)"
                >{{ localization.t(column.label) }}</AbpButton
              >
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <div class="d-flex gap-2 flex-wrap">
                <AbpButton
                  variant="secondary"
                  size="sm"
                  :disabled="busy"
                  @click="selected = item"
                  >{{ localization.t('AbpIdentity::Session:Detail') }}</AbpButton
                ><AbpButton
                  variant="danger"
                  size="sm"
                  :disabled="busy || failed"
                  @click="revoke(item)"
                  >{{ localization.t('AbpIdentity::Session:Logout') }}</AbpButton
                >
              </div>
            </td>
            <td>
              {{ item.device
              }}<span v-if="item.isCurrent" class="badge text-bg-info">{{
                localization.t('AbpIdentity::Session:Current')
              }}</span>
            </td>
            <td>{{ item.deviceInfo }}</td>
            <td>{{ date(item.signedIn) }}</td>
            <td>{{ date(item.lastAccessed) }}</td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="5">{{ localization.t('AbpUi::NoDataAvailableInDatatable') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <AbpPagination
      :page="list.page.value"
      :page-size="list.maxResultCount.value"
      :total="list.totalCount.value"
      :disabled="busy"
      @update:page="list.page.value = $event"
      @update:page-size="list.maxResultCount.value = $event"
    />
    <p v-if="revokeFailed" role="alert">
      {{ revokeFailureText
      }}<AbpButton variant="secondary" @click="refresh">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <template #footer="{ close }"
      ><AbpButton variant="secondary" :disabled="busy" @click="close">{{
        localization.t('AbpUi::Close')
      }}</AbpButton></template
    >
  </AbpModal>
  <SessionDetailsDialog
    v-if="selected?.id"
    :session-id="selected.id"
    :user-id="userId"
    :is-current="selected.isCurrent"
    @close="selected = undefined"
  />
</template>
<script setup lang="ts">
import {
  AuthService,
  ConfigStateService,
  inject as injectAbp,
  useListService,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentitySessionService, type IdentitySessionDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpPagination,
  AbpSpinner,
  ConfirmationStatus,
  useConfirmation,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { formatIdentityUserDetailsDate } from '../utils/user-details.js';
import { isCurrentIdentitySession } from '../utils/identity-session.js';
import SessionDetailsDialog from './SessionDetailsDialog.vue';
const props = defineProps<{ userId: string; displayName?: string | undefined }>();
const emit = defineEmits<{ close: [] }>();
const service = injectAbp(IdentitySessionService);
const config = injectAbp(ConfigStateService);
const auth = injectAbp(AuthService, { optional: true });
const localization = useLocalization();
const permission = usePermission();
const confirmation = useConfirmation();
const list = useListService({ sortKey: 'signedIn', sortOrder: 'desc' });
const selected = shallowRef<IdentitySessionDto>();
const filterDraft = reactive({ device: '', clientId: '' });
const filters = shallowRef<{ device?: string | undefined; clientId?: string | undefined }>({});
const failed = ref(false);
const revokeFailed = ref(false);
const busy = ref(false);
let revision = 0;
let controller = new AbortController();
const allowed = computed(() => permission.isGranted('AbpIdentity.Sessions'));
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    allowed.value,
  ]),
);
const columns = [
  { name: 'device', label: 'AbpIdentity::Session:Device' },
  { name: 'deviceInfo', label: 'AbpIdentity::Session:DeviceInfo' },
  { name: 'signedIn', label: 'AbpIdentity::Session:SignedIn' },
  { name: 'lastAccessed', label: 'AbpIdentity::Session:LastAccessed' },
];
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const revokeFailureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const date = (value?: string | null) =>
  formatIdentityUserDetailsDate(value, config.snapshot().localization.currentCulture) ??
  localization.t('AbpIdentity::Dash');
const { items } = list.hookToQuery(async (query, signal) => {
  if (!allowed.value) return { items: [], totalCount: 0 };
  const own = revision;
  const requestSignal = AbortSignal.any([signal, controller.signal]);
  try {
    const value = await service.getList(
      { ...query, ...filters.value, userId: props.userId },
      { signal: requestSignal, skipHandleError: true },
    );
    if (own !== revision || requestSignal.aborted) return { items: [], totalCount: 0 };
    if (value.items.some(item => item.userId !== props.userId))
      throw new TypeError('The session list contains another user.');
    failed.value = false;
    revokeFailed.value = false;
    return value;
  } catch (error) {
    if (own === revision && !requestSignal.aborted) failed.value = true;
    throw error;
  }
});
function reset(): void {
  revision += 1;
  controller.abort();
  controller = new AbortController();
  items.value = [];
  list.totalCount.value = 0;
  selected.value = undefined;
  failed.value = false;
  revokeFailed.value = false;
  busy.value = false;
}
function applyFilters(): void {
  if (!busy.value && allowed.value) {
    filters.value = {
      device: filterDraft.device || undefined,
      clientId: filterDraft.clientId || undefined,
    };
    list.get();
  }
}
function clearFilters(): void {
  filterDraft.device = '';
  filterDraft.clientId = '';
  applyFilters();
}
function refresh(): void {
  if (!busy.value) list.getWithoutPageReset();
}
function sort(name: string): void {
  if (busy.value) return;
  list.sortOrder.value =
    list.sortKey.value === name && list.sortOrder.value === 'asc' ? 'desc' : 'asc';
  list.sortKey.value = name;
  list.page.value = 0;
}
async function revoke(item: IdentitySessionDto): Promise<void> {
  if (
    !allowed.value ||
    busy.value ||
    failed.value ||
    revokeFailed.value ||
    !item.id ||
    item.userId !== props.userId
  )
    return;
  const own = revision;
  const signal = controller.signal;
  busy.value = true;
  try {
    const answer = await confirmation.warn(
      'AbpIdentity::SessionLogoutConfirmationMessage',
      'AbpUi::AreYouSure',
    );
    if (
      answer !== ConfirmationStatus.confirm ||
      own !== revision ||
      signal.aborted ||
      !allowed.value
    )
      return;
    const fresh = await service.get(item.id, { signal, skipHandleError: true });
    if (own !== revision || signal.aborted) return;
    if (fresh.id !== item.id || fresh.userId !== props.userId)
      throw new TypeError('The session does not match the selected user.');
    await service.revoke(item.id, { signal, skipHandleError: true });
    if (own !== revision || signal.aborted) return;
    if (isCurrentIdentitySession(fresh, config.snapshot().currentUser, item)) {
      emit('close');
      if (auth?.clearSession) await auth.clearSession();
      else if (auth) {
        await auth.logout();
        return;
      }
      await config.refreshAppState();
      return;
    }
    list.getWithoutPageReset();
  } catch {
    if (own === revision && !signal.aborted) revokeFailed.value = true;
  } finally {
    if (own === revision) busy.value = false;
  }
}
watch(
  () => props.userId,
  () => {
    reset();
    list.get();
  },
);
watch(
  context,
  () => {
    reset();
    emit('close');
  },
  { flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
