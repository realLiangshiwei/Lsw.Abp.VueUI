<template>
  <AbpModal
    :visible="true"
    :dirty="Boolean(emails)"
    :suppress-unsaved-changes-warning="!emails.trim()"
    @update:visible="$event || close()"
  >
    <template #header>{{ localization.t('AbpIdentity::InviteUser') }}</template>
    <div
      class="d-flex gap-2 mb-3"
      role="tablist"
      :aria-label="localization.t('AbpIdentity::InviteUser')"
    >
      <AbpButton
        role="tab"
        :aria-selected="tab === 'invite'"
        :disabled="confirming || busy"
        @click="tab = 'invite'"
        >{{ localization.t('AbpIdentity::InviteUser') }}</AbpButton
      >
      <AbpButton
        role="tab"
        :aria-selected="tab === 'pending'"
        :disabled="confirming || busy"
        @click="tab = 'pending'"
        >{{ localization.t('AbpIdentity::PendingInvitation') }}</AbpButton
      >
    </div>
    <p v-if="error || failed" role="alert">
      {{ error || localization.t('AbpUi::ErrorLoadingDatatable') }}
    </p>
    <AbpButton
      v-if="failed || uncertain"
      variant="secondary"
      :disabled="confirming || busy"
      @click="reload"
      >{{ localization.t('AbpUi::Refresh') }}</AbpButton
    >
    <AbpSpinner v-if="loading" />
    <form v-if="tab === 'invite'" :id="formId" @submit.prevent="invite">
      <AbpFormField
        v-slot="field"
        :label="localization.t('AbpIdentity::InviteEmailAddress')"
        required
      >
        <textarea
          :id="field.id"
          v-model="emails"
          name="invitationEmails"
          class="form-control"
          rows="4"
          :disabled="confirming || busy || loading"
          :placeholder="localization.t('AbpIdentity::OneEmailPerLines')"
        />
      </AbpFormField>
      <fieldset :disabled="confirming || busy || loading || !rolesReady">
        <legend class="fs-6">{{ localization.t('AbpIdentity::PreassignRolesForInvitees') }}</legend>
        <AbpToggle
          v-for="role in roles"
          :key="role.id ?? role.name ?? ''"
          :model-value="selectedRoles.includes(role.name ?? '')"
          :label="role.name"
          @update:model-value="toggleRole(role.name ?? '', $event === true)"
        />
      </fieldset>
      <div v-if="summary" role="status">
        <p>
          {{
            localization.t(
              'AbpIdentity::InvitationSentSuccessfullyToUsers',
              String(summary.newInvitations),
            )
          }}
        </p>
        <p>
          {{
            localization.t(
              'AbpIdentity::InvitationResentSuccessfullyToUsers',
              String(summary.resentInvitations),
            )
          }}
        </p>
      </div>
    </form>
    <div v-else>
      <form
        class="d-flex flex-wrap gap-2 mb-3"
        @submit.prevent="
          page = 0;
          loadPending();
        "
      >
        <AbpInput
          v-model="filter"
          name="invitationFilter"
          type="search"
          :aria-label="localization.t('AbpUi::Search')"
          :disabled="confirming || busy"
        />
        <AbpButton type="submit" :disabled="confirming || busy">{{
          localization.t('AbpUi::Search')
        }}</AbpButton>
        <AbpButton
          variant="danger"
          :disabled="confirming || busy || loading || !pendingReady || !tenantTotal || uncertain"
          @click="cancelAll"
          >{{ localization.t('AbpIdentity::CancelAllPendingIvitations') }}</AbpButton
        >
      </form>
      <div style="overflow-x: auto">
        <table class="table">
          <thead>
            <tr>
              <th :aria-sort="sortDirection('inviteeEmail')">
                <AbpButton
                  variant="secondary"
                  :disabled="confirming || busy"
                  @click="sortPending('inviteeEmail')"
                  >{{ localization.t('AbpIdentity::InviteeEmail') }}</AbpButton
                >
              </th>
              <th :aria-sort="sortDirection('invitationDate')">
                <AbpButton
                  variant="secondary"
                  :disabled="confirming || busy"
                  @click="sortPending('invitationDate')"
                  >{{ localization.t('AbpIdentity::InvitationDate') }}</AbpButton
                >
              </th>
              <th>{{ localization.t('AbpUi::Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pending" :key="row.id">
              <td style="overflow-wrap: anywhere">{{ row.inviteeEmail }}</td>
              <td>{{ row.invitationDate }}</td>
              <td>
                <div class="d-flex flex-wrap gap-2">
                  <AbpButton :disabled="confirming || busy || uncertain" @click="resend(row)">{{
                    localization.t('AbpIdentity::ResendInvitation')
                  }}</AbpButton
                  ><AbpButton
                    variant="danger"
                    :disabled="confirming || busy || uncertain"
                    @click="cancel(row)"
                    >{{ localization.t('AbpIdentity::CancelInvitation') }}</AbpButton
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="pendingReady" role="status">{{ total }}</p>
      <div class="d-flex gap-2">
        <AbpButton
          :disabled="confirming || busy || loading || !pendingReady || page === 0"
          @click="
            page--;
            loadPending(true);
          "
          >{{ localization.t('AbpUi::PagerPrevious') }}</AbpButton
        ><AbpButton
          :disabled="
            confirming || busy || loading || !pendingReady || (page + 1) * pageSize >= total
          "
          @click="
            page++;
            loadPending(true);
          "
          >{{ localization.t('AbpUi::PagerNext') }}</AbpButton
        >
      </div>
    </div>
    <template #footer="{ close: requestClose }">
      <AbpButton variant="secondary" :disabled="confirming || busy" @click="requestClose">{{
        localization.t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton
        v-if="tab === 'invite'"
        :form="formId"
        type="submit"
        :disabled="
          confirming || busy || loading || failed || uncertain || !rolesReady || !mayInvite
        "
        :loading="busy"
        >{{ localization.t('AbpIdentity::InviteUser') }}</AbpButton
      >
    </template>
  </AbpModal>
</template>
<script setup lang="ts">
import {
  ConfigStateService,
  EnvironmentService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import type {
  IdentityRoleDto,
  InviteUsersSummaryDto,
  UserSharingInvitationDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpToggle,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSpinner,
  ConfirmationService,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, useId, watch } from 'vue';
import { createInvitationInput } from '../utils/invitations.js';
class PendingInvitationSnapshotError extends Error {
  constructor() {
    super(
      'The complete pending invitation snapshot is unavailable. Refresh the pending invitations.',
    );
    this.name = 'PendingInvitationSnapshotError';
  }
}
const props = defineProps<{
  initialTab?: 'invite' | 'pending' | undefined;
  appName?: string | undefined;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const service = injectAbp(IdentityUserService);
const config = injectAbp(ConfigStateService);
const environment = injectAbp(EnvironmentService);
const confirmation = injectAbp(ConfirmationService);
const permission = usePermission();
const localization = useLocalization();
const formId = useId();
const tab = ref(props.initialTab ?? 'invite');
const emails = ref('');
const selectedRoles = ref<string[]>([]);
const roles = ref<IdentityRoleDto[]>([]);
const rolesReady = ref(false);
const pendingReady = ref(false);
const pending = ref<UserSharingInvitationDto[]>([]);
const summary = ref<InviteUsersSummaryDto>();
const total = ref(0);
const tenantTotal = ref(0);
const completePending = shallowRef<{
  key: string;
  rows: UserSharingInvitationDto[];
  total: number;
} | null>(null);
const filter = ref('');
const page = ref(0);
const sorting = ref<
  'inviteeEmail asc' | 'inviteeEmail desc' | 'invitationDate asc' | 'invitationDate desc'
>('invitationDate desc');
const pageSize = 10;
const rolesLoading = ref(false);
const pendingLoading = ref(false);
const busy = ref(false);
const confirming = ref(false);
const rolesFailed = ref(false);
const pendingFailed = ref(false);
const loading = computed(() =>
  tab.value === 'invite' ? rolesLoading.value : pendingLoading.value,
);
const failed = computed(() => (tab.value === 'invite' ? rolesFailed.value : pendingFailed.value));
const uncertain = ref(false);
const error = ref('');
let revision = 0;
let pendingRevision = 0;
let controller = new AbortController();
let pendingController = new AbortController();
let closed = false;
const mayInvite = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    config.snapshot().multiTenancy.userSharingStrategy === 1 &&
    Boolean(config.snapshot().currentTenant.id) &&
    permission.isGranted('AbpIdentity.Users && AbpIdentity.Users.Create'),
);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentTenant.id,
    mayInvite.value,
  ]),
);
const appName = computed(
  () =>
    props.appName ??
    (environment.getEnvironment().oAuthConfig?.responseType === 'code' ? 'MVC' : 'Angular'),
);
function current(own: number) {
  return !closed && own === revision && mayInvite.value;
}
function requestConfig() {
  return { signal: controller.signal, skipHandleError: true };
}
function toggleRole(name: string, checked: boolean) {
  if (busy.value || !rolesReady.value) return;
  selectedRoles.value = checked
    ? [...new Set([...selectedRoles.value, name])]
    : selectedRoles.value.filter(item => item !== name);
}
async function loadRoles() {
  const own = revision;
  rolesReady.value = false;
  rolesLoading.value = true;
  rolesFailed.value = false;
  try {
    const response = await service.getAssignableRoles(requestConfig());
    if (!current(own)) return;
    roles.value = response.items ?? [];
    selectedRoles.value = selectedRoles.value.filter(name =>
      roles.value.some(role => role.name === name),
    );
    rolesReady.value = true;
  } catch {
    if (current(own)) rolesFailed.value = true;
  } finally {
    if (current(own)) rolesLoading.value = false;
  }
}
function sortDirection(field: 'inviteeEmail' | 'invitationDate') {
  if (!sorting.value.startsWith(`${field} `)) return 'none';
  return sorting.value.endsWith(' asc') ? 'ascending' : 'descending';
}
function sortPending(field: 'inviteeEmail' | 'invitationDate') {
  if (confirming.value || busy.value || !mayInvite.value) return;
  sorting.value = sorting.value === `${field} asc` ? `${field} desc` : `${field} asc`;
  page.value = 0;
  void loadPending();
}
async function loadPending(reuseSnapshot = false) {
  if (!mayInvite.value || busy.value || closed) return;
  const own = revision;
  const queryOwn = ++pendingRevision;
  pendingController.abort();
  pendingController = new AbortController();
  const isCurrentQuery = () => current(own) && queryOwn === pendingRevision;
  const queryFilter = filter.value.trim().toLowerCase();
  const querySorting = sorting.value;
  const key = JSON.stringify([queryFilter, querySorting]);
  pendingLoading.value = true;
  pendingReady.value = false;
  pending.value = [];
  total.value = 0;
  pendingFailed.value = false;
  const publish = (rows: UserSharingInvitationDto[], count: number) => {
    total.value = count;
    page.value = Math.min(page.value, Math.max(0, Math.ceil(count / pageSize) - 1));
    pending.value = rows.slice(page.value * pageSize, (page.value + 1) * pageSize);
    pendingReady.value = true;
  };
  try {
    if (queryFilter) {
      let snapshot =
        reuseSnapshot && completePending.value?.key === key ? completePending.value : null;
      if (!snapshot) {
        completePending.value = null;
        const rows: UserSharingInvitationDto[] = [];
        const ids = new Set<string>();
        let expected: number | undefined;
        do {
          const result = await service.getPendingInvitations(
            { sorting: querySorting, skipCount: rows.length, maxResultCount: 1000 },
            { ...requestConfig(), signal: pendingController.signal },
          );
          if (!isCurrentQuery()) return;
          const count = result.totalCount;
          const items = result.items ?? [];
          if (
            !Number.isSafeInteger(count) ||
            count < 0 ||
            (expected !== undefined && count !== expected) ||
            items.length > 1000 ||
            (!items.length && rows.length < count)
          )
            throw new PendingInvitationSnapshotError();
          expected = count;
          for (const item of items) {
            if (!item.id || ids.has(item.id.toLowerCase()))
              throw new PendingInvitationSnapshotError();
            ids.add(item.id.toLowerCase());
            rows.push(item);
          }
          if (rows.length > count) throw new PendingInvitationSnapshotError();
        } while (rows.length < (expected ?? 0));
        snapshot = { key, rows, total: expected ?? 0 };
        completePending.value = snapshot;
      }
      tenantTotal.value = snapshot.total;
      const matching = snapshot.rows.filter(item =>
        item.inviteeEmail?.toLowerCase().includes(queryFilter),
      );
      publish(matching, matching.length);
    } else {
      completePending.value = null;
      const result = await service.getPendingInvitations(
        { sorting: querySorting, skipCount: page.value * pageSize, maxResultCount: pageSize },
        { ...requestConfig(), signal: pendingController.signal },
      );
      if (!isCurrentQuery()) return;
      if (!Number.isSafeInteger(result.totalCount) || result.totalCount < 0)
        throw new PendingInvitationSnapshotError();
      pending.value = result.items ?? [];
      total.value = result.totalCount;
      tenantTotal.value = result.totalCount;
      pendingReady.value = true;
    }
  } catch {
    if (isCurrentQuery()) {
      completePending.value = null;
      pending.value = [];
      total.value = 0;
      pendingFailed.value = true;
    }
  } finally {
    if (isCurrentQuery()) pendingLoading.value = false;
  }
}

function invalidatePending() {
  pendingController.abort();
  pendingRevision++;
  completePending.value = null;
  pendingReady.value = false;
  pendingLoading.value = false;
}

async function reload() {
  if (!mayInvite.value || busy.value || closed) return;
  const own = ++revision;
  controller.abort();
  controller = new AbortController();
  invalidatePending();
  pending.value = [];
  total.value = 0;
  pendingFailed.value = false;
  if (!uncertain.value) {
    error.value = '';
    const reads = [loadRoles()];
    if (tab.value === 'pending') reads.push(loadPending());
    await Promise.all(reads);
    return;
  }
  await loadRoles();
  if (!current(own) || !rolesReady.value) return;
  await loadPending();
  if (current(own) && pendingReady.value) {
    uncertain.value = false;
    error.value = '';
  }
}
async function mutate(action: () => Promise<void>) {
  if (
    !mayInvite.value ||
    busy.value ||
    confirming.value ||
    loading.value ||
    failed.value ||
    uncertain.value
  )
    return;
  const own = revision;
  busy.value = true;
  invalidatePending();
  error.value = '';
  try {
    await action();
    if (!current(own)) return;
    emit('saved');
    busy.value = false;
    if (tab.value === 'pending') await loadPending();
  } catch {
    if (current(own)) {
      uncertain.value = true;
      error.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
  } finally {
    if (current(own)) busy.value = false;
  }
}
async function invite() {
  if (!rolesReady.value) return;
  const input = createInvitationInput(
    emails.value,
    selectedRoles.value,
    roles.value,
    appName.value,
  );
  if (!input) {
    error.value = localization.t('AbpValidation::ThisFieldIsNotValid.');
    return;
  }
  await mutate(async () => {
    const own = revision;
    const result = await service.inviteUsers(input, requestConfig());
    if (current(own)) {
      summary.value = result;
      emails.value = '';
    }
  });
}
async function resend(row: UserSharingInvitationDto) {
  if (!pendingReady.value || !pending.value.some(item => item.id === row.id)) return;
  await mutate(() =>
    service.resendInvitation({ id: row.id, appName: appName.value }, requestConfig()),
  );
}
async function cancel(row: UserSharingInvitationDto) {
  const own = revision;
  const id = row.id;
  if (!id || !pendingReady.value || busy.value || confirming.value || uncertain.value) return;
  confirming.value = true;
  const status = await confirmation.warn(
    localization.t('AbpIdentity::CancelInvitation'),
    'AbpUi::AreYouSure',
    { messageLocalizationParams: [row.inviteeEmail ?? ''] },
  );
  confirming.value = false;
  if (status === 'confirm' && current(own))
    await mutate(() => service.cancelInvitation(id, requestConfig()));
}
async function cancelAll() {
  const own = revision;
  if (
    !pendingReady.value ||
    !tenantTotal.value ||
    busy.value ||
    confirming.value ||
    uncertain.value
  )
    return;
  confirming.value = true;
  const status = await confirmation.warn(
    'AbpIdentity::AreYouSureToCancelAllPendingInvitations',
    'AbpUi::AreYouSure',
  );
  confirming.value = false;
  if (status === 'confirm' && current(own))
    await mutate(() => service.cancelAllPendingInvitations(requestConfig()));
}
function dispose() {
  closed = true;
  revision++;
  controller.abort();
  invalidatePending();
}
function close() {
  if (closed) return;
  dispose();
  emit('close');
}
watch(filter, () => {
  page.value = 0;
  invalidatePending();
  pending.value = [];
  total.value = 0;
});
watch(tab, value => {
  if (!uncertain.value) error.value = '';
  if (value === 'pending' && !pendingReady.value && !pendingLoading.value) void loadPending();
});
watch(
  context,
  (value, previous) => {
    if (previous !== undefined && value !== previous) close();
    else if (mayInvite.value) void reload();
    else close();
  },
  { immediate: true, flush: 'sync' },
);
onBeforeUnmount(dispose);
</script>
