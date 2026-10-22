<template>
  <main>
    <h1>{{ localization.t('AbpAccount::MyAccount') }}</h1>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <AbpButton v-if="!authenticated" @click="signIn">{{
      localization.t('AbpAccount::Login')
    }}</AbpButton>
    <template v-else>
      <section
        v-if="handoff"
        class="border rounded p-3 mb-3"
        :aria-label="localization.t('AbpAccount::LoginAsThisAccount')"
      >
        <h2 class="fs-4">
          {{ localization.t('AbpAccount::LoginAsThisAccount') }}
        </h2>
        <p>
          {{ handoff.sourceUserName }} ·
          {{ handoff.sourceTenantName || localization.t('AbpAccount::HostDisplayName') }}
        </p>
        <p>
          {{ handoff.target.targetUserName }} ·
          {{ handoff.target.targetTenantName || localization.t('AbpAccount::HostDisplayName') }}
        </p>
        <div class="d-flex flex-wrap gap-2">
          <AbpButton :disabled="busy" @click="confirmHandoff">{{
            localization.t('AbpAccount::LoginAsThisAccount')
          }}</AbpButton
          ><AbpButton variant="secondary" :disabled="busy" @click="cancelHandoff">{{
            localization.t('AbpUi::Cancel')
          }}</AbpButton>
        </div>
      </section>
      <p>
        {{ currentUser.userName }} ·
        {{ currentTenant.name || localization.t('AbpAccount::HostDisplayName') }}
      </p>
      <AbpButton
        v-if="isImpersonating"
        :disabled="busy || confirming"
        @click="returnToImpersonator"
        >{{ localization.t('AbpAccount::BackToImpersonator') }}</AbpButton
      >
      <div
        class="d-flex flex-wrap gap-2 my-3"
        role="tablist"
        :aria-label="localization.t('AbpAccount::MyAccount')"
      >
        <AbpButton
          v-for="item in sections"
          :key="item.value"
          role="tab"
          :aria-selected="section === item.value"
          :disabled="busy || confirming"
          @click="setSection(item.value)"
          >{{ item.label }}</AbpButton
        >
      </div>
      <AbpButton variant="secondary" :disabled="busy || loading" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
      <AbpSpinner v-if="loading" />
      <div v-if="section === 'links'">
        <h2 class="fs-4">{{ localization.t('AbpAccount::LinkedAccounts') }}</h2>
        <form class="d-flex flex-wrap gap-2 my-3" @submit.prevent="beginLink">
          <AbpFormField
            v-slot="field"
            :label="localization.t('AbpAccount::NewLinkAccountTargetUserNameOrEmail')"
            required
            ><AbpInput
              :id="field.id"
              v-model="linkTarget"
              name="linkTarget"
              :disabled="blocked"
              autocomplete="off"
          /></AbpFormField>
          <AbpButton type="submit" :disabled="blocked || !linkTarget.trim()">{{
            localization.t('AbpAccount::NewLinkAccount')
          }}</AbpButton>
        </form>
        <AbpInput
          v-model="filter"
          type="search"
          name="linkedAccountFilter"
          :aria-label="localization.t('AbpUi::Search')"
        />
        <div style="overflow-x: auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ localization.t('AbpAccount::UserName') }}</th>
                <th>{{ localization.t('AbpAccount::DirectlyLinked') }}</th>
                <th>{{ localization.t('AbpUi::Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in pagedLinks"
                :key="`${record.targetTenantId ?? ''}:${record.targetUserId}`"
              >
                <td style="overflow-wrap: anywhere">
                  {{ record.targetTenantName ? `${record.targetTenantName}\\` : ''
                  }}{{ record.targetUserName }}
                </td>
                <td>
                  {{
                    record.directlyLinked
                      ? localization.t('AbpUi::Yes')
                      : localization.t('AbpUi::No')
                  }}
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-2">
                    <AbpButton :disabled="blocked" @click="loginAs(record)">{{
                      localization.t('AbpAccount::LoginAsThisAccount')
                    }}</AbpButton
                    ><AbpButton
                      v-if="record.directlyLinked"
                      variant="danger"
                      :disabled="blocked"
                      @click="unlink(record)"
                      >{{ localization.t('AbpUi::Delete') }}</AbpButton
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="section === 'delegation'">
        <h2 class="fs-4">{{ localization.t('AbpIdentity::AuthorityDelegation') }}</h2>
        <div class="d-flex flex-wrap gap-2 my-3">
          <AbpButton
            :disabled="blocked"
            :aria-pressed="delegationDirection === 'outgoing'"
            @click="
              delegationDirection = 'outgoing';
              page = 0;
            "
            >{{ localization.t('AbpIdentity::DelegatedUsers') }}</AbpButton
          ><AbpButton
            :disabled="blocked"
            :aria-pressed="delegationDirection === 'incoming'"
            @click="
              delegationDirection = 'incoming';
              page = 0;
            "
            >{{ localization.t('AbpIdentity::MyDelegatedUsers') }}</AbpButton
          >
        </div>
        <form v-if="delegationDirection === 'outgoing'" :id="formId" @submit.prevent="delegate">
          <div class="d-flex flex-wrap gap-2">
            <AbpFormField v-slot="field" :label="localization.t('AbpAccount::UserName')"
              ><AbpInput
                :id="field.id"
                v-model="lookupFilter"
                name="delegationLookup"
                :disabled="blocked" /></AbpFormField
            ><AbpButton :disabled="blocked || lookupLoading" @click="lookup">{{
              localization.t('AbpUi::Search')
            }}</AbpButton>
          </div>
          <AbpFormField
            v-slot="field"
            :label="localization.t('AbpAccount::AuthorityDelegation:PleaseSelectUser')"
            required
            ><AbpSelect
              :id="field.id"
              v-model="targetUserId"
              name="delegationUser"
              :options="lookupOptions"
              :disabled="blocked || lookupLoading"
          /></AbpFormField>
          <AbpFormField v-slot="field" :label="localization.t('AbpIdentity::StartTime')" required
            ><AbpDatePicker
              :id="field.id"
              v-model="startTime"
              name="delegationStart"
              type="datetime"
              :disabled="blocked"
          /></AbpFormField>
          <AbpFormField v-slot="field" :label="localization.t('AbpIdentity::EndTime')" required
            ><AbpDatePicker
              :id="field.id"
              v-model="endTime"
              name="delegationEnd"
              type="datetime"
              :disabled="blocked"
          /></AbpFormField>
          <AbpButton type="submit" :disabled="blocked || lookupLoading || !targetUserId">{{
            localization.t('AbpUi::Save')
          }}</AbpButton>
        </form>
        <AbpInput
          v-model="filter"
          type="search"
          name="delegationFilter"
          :aria-label="localization.t('AbpUi::Search')"
          class="my-3"
        />
        <div style="overflow-x: auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ localization.t('AbpAccount::UserName') }}</th>
                <th>{{ localization.t('AbpIdentity::StartTime') }}</th>
                <th>{{ localization.t('AbpIdentity::EndTime') }}</th>
                <th>{{ localization.t('AbpIdentity::Status') }}</th>
                <th>{{ localization.t('AbpUi::Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in pagedDelegations" :key="record.id">
                <td>{{ record.userName }}</td>
                <td>{{ record.startTime }}</td>
                <td>{{ record.endTime }}</td>
                <td>
                  {{ localization.t(recordStatus(record)) }}
                </td>
                <td>
                  <AbpButton
                    v-if="delegationDirection === 'outgoing'"
                    variant="danger"
                    :disabled="blocked"
                    @click="deleteDelegation(record)"
                    >{{ localization.t('AbpUi::Delete') }}</AbpButton
                  ><AbpButton
                    v-else
                    :disabled="blocked || isImpersonating || !activeDelegationIds.has(record.id)"
                    @click="useDelegation(record)"
                    >{{ localization.t('AbpAccount::LoginAsThisAccount') }}</AbpButton
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="section === 'tenants' && shared">
        <h2 class="fs-4">{{ localization.t('AbpAccount::SwitchTenant') }}</h2>
        <p>
          {{ localization.t('AbpAccount::CannotLeaveCurrentlySignedInTenant') }}
        </p>
        <AbpInput
          v-model="filter"
          type="search"
          name="tenantFilter"
          :aria-label="localization.t('AbpUi::Search')"
          class="my-3"
        />
        <div style="overflow-x: auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ localization.t('AbpAccount::TenantName') }}</th>
                <th>{{ localization.t('AbpUi::Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in pagedTenants" :key="record.tenantId ?? 'host'">
                <td>{{ record.tenantName || localization.t('AbpAccount::HostDisplayName') }}</td>
                <td>
                  <div class="d-flex flex-wrap gap-2">
                    <AbpButton
                      :disabled="blocked || isCurrentTenant(record) || isImpersonating"
                      @click="switchTenant(record)"
                      >{{ localization.t('AbpAccount::SwitchToThisTenant') }}</AbpButton
                    ><AbpButton
                      variant="danger"
                      :aria-label="
                        localization.t(
                          'AbpAccount::AreYouSureYouWantToLeaveTenant',
                          record.tenantName || localization.t('AbpAccount::HostDisplayName'),
                        )
                      "
                      :disabled="blocked || isCurrentTenant(record) || isImpersonating"
                      @click="leave(record)"
                      >{{ localization.t('AbpIdentity::RemoveFromTenant') }}</AbpButton
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p v-if="ready" role="status">{{ resultCount }}</p>
      <div class="d-flex gap-2">
        <AbpButton :disabled="loading || busy || page === 0" @click="page--">{{
          localization.t('AbpUi::PagerPrevious')
        }}</AbpButton
        ><AbpButton
          :disabled="loading || busy || (page + 1) * pageSize >= resultCount"
          @click="page++"
          >{{ localization.t('AbpUi::PagerNext') }}</AbpButton
        >
      </div>
    </template>
  </main>
</template>
<script setup lang="ts">
import {
  AuthService,
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
} from '@lsw-abpvue/core';
import {
  IdentityLinkUserService,
  IdentityUserDelegationService,
  UserSharingService,
} from '@lsw-abpvue/account-pro/proxy';
import type {
  LinkUserDto,
  UserDelegationDto,
  UserLookupDto,
  UserSharingDto,
} from '@lsw-abpvue/account-pro/proxy';
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpSpinner,
  ConfirmationService,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AccountWorkflowsService } from '../services/account-workflows.service.js';
import { delegationStatus } from '../utils/account-workflows.js';
const config = injectAbp(ConfigStateService);
const auth = injectAbp(AuthService);
const workflow = injectAbp(AccountWorkflowsService);
const linkService = injectAbp(IdentityLinkUserService);
const delegationService = injectAbp(IdentityUserDelegationService);
const sharingService = injectAbp(UserSharingService);
const confirmation = injectAbp(ConfirmationService);
const localization = useLocalization();
const route = useRoute();
const router = useRouter();
const formId = useId();
const handoff = workflow.pendingHandoff;
const currentUser = computed(() => config.snapshot().currentUser);
const currentTenant = computed(() => config.snapshot().currentTenant);
const authenticated = computed(
  () => auth.isAuthenticated.value && currentUser.value.isAuthenticated,
);
const isImpersonating = computed(() =>
  Boolean(currentUser.value.impersonatorUserId || currentUser.value.impersonatorTenantId),
);
const shared = computed(() => config.snapshot().multiTenancy.userSharingStrategy === 1);
const sections = computed(() => [
  { value: 'links', label: localization.t('AbpAccount::LinkedAccounts') },
  { value: 'delegation', label: localization.t('AbpIdentity::AuthorityDelegation') },
  ...(shared.value
    ? [{ value: 'tenants', label: localization.t('AbpAccount::SwitchTenant') }]
    : []),
]);
const section = ref(
  typeof route.query.section === 'string' &&
    ['links', 'delegation', 'tenants'].includes(route.query.section)
    ? route.query.section
    : 'links',
);
const filter = ref('');
const page = ref(0);
const pageSize = 5;
const links = ref<LinkUserDto[]>([]);
const outgoing = ref<UserDelegationDto[]>([]);
const incoming = ref<UserDelegationDto[]>([]);
const activeDelegations = ref<UserDelegationDto[]>([]);
const tenants = ref<UserSharingDto[]>([]);
const delegationDirection = ref<'outgoing' | 'incoming'>('outgoing');
const linkTarget = ref('');
const lookupFilter = ref('');
const lookupUsers = ref<UserLookupDto[]>([]);
const lookupLoading = ref(false);
const targetUserId = ref('');
const startTime = ref<string | null>('');
const endTime = ref<string | null>('');
const ready = ref(false);
const loading = ref(false);
const busy = ref(false);
const confirming = ref(false);
const uncertain = ref(false);
const error = ref('');
const notice = ref('');
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
let revision = 0;
let lookupRevision = 0;
let controller = new AbortController();
let disposed = false;
const context = computed(() =>
  JSON.stringify([
    currentUser.value.id,
    currentTenant.value.id,
    authenticated.value,
    shared.value,
    currentUser.value.impersonatorUserId,
  ]),
);
const blocked = computed(
  () =>
    !authenticated.value ||
    !ready.value ||
    loading.value ||
    busy.value ||
    confirming.value ||
    uncertain.value,
);
const activeDelegationIds = computed(() => new Set(activeDelegations.value.map(item => item.id)));
const lookupOptions = computed(() =>
  lookupUsers.value
    .filter(item => item.id && item.id !== currentUser.value.id)
    .map(item => ({ value: item.id ?? '', label: item.userName ?? item.id ?? '' })),
);
const matches = (value: string | undefined) =>
  (value ?? '').toLocaleLowerCase().includes(filter.value.trim().toLocaleLowerCase());
const filteredLinks = computed(() =>
  links.value.filter(item => matches(item.targetUserName) || matches(item.targetTenantName)),
);
const filteredDelegations = computed(() =>
  (delegationDirection.value === 'outgoing' ? outgoing.value : incoming.value).filter(item =>
    matches(item.userName),
  ),
);
const filteredTenants = computed(() =>
  tenants.value.filter(item =>
    matches(item.tenantName || localization.t('AbpAccount::HostDisplayName')),
  ),
);
const pagedLinks = computed(() =>
  filteredLinks.value.slice(page.value * pageSize, (page.value + 1) * pageSize),
);
const pagedDelegations = computed(() =>
  filteredDelegations.value.slice(page.value * pageSize, (page.value + 1) * pageSize),
);
const pagedTenants = computed(() =>
  filteredTenants.value.slice(page.value * pageSize, (page.value + 1) * pageSize),
);
const resultCount = computed(() =>
  section.value === 'links'
    ? filteredLinks.value.length
    : section.value === 'delegation'
      ? filteredDelegations.value.length
      : filteredTenants.value.length,
);
function current(own: number) {
  return !disposed && own === revision && authenticated.value;
}
function request() {
  return { signal: controller.signal, skipHandleError: true };
}
function reset() {
  revision++;
  lookupRevision++;
  controller.abort();
  controller = new AbortController();
  ready.value = false;
  loading.value = false;
  busy.value = false;
  links.value = [];
  outgoing.value = [];
  incoming.value = [];
  activeDelegations.value = [];
  tenants.value = [];
  lookupUsers.value = [];
  targetUserId.value = '';
  page.value = 0;
}
async function load() {
  if (!authenticated.value || busy.value || disposed) return;
  reset();
  const own = revision;
  loading.value = true;
  error.value = '';
  try {
    if (section.value === 'links') {
      const result = await linkService.getAllList(request());
      if (!current(own)) return;
      links.value = result.items ?? [];
    } else if (section.value === 'delegation') {
      const result = await Promise.all([
        delegationService.getDelegatedUsers(request()),
        delegationService.getMyDelegatedUsers(request()),
        delegationService.getActiveDelegations(request()),
      ]);
      if (!current(own)) return;
      outgoing.value = result[0].items ?? [];
      incoming.value = result[1].items ?? [];
      activeDelegations.value = result[2].items ?? [];
    } else if (shared.value) {
      const result = await sharingService.getAllList(request());
      if (!current(own)) return;
      tenants.value = result.items ?? [];
    }
    if (current(own)) {
      ready.value = true;
      uncertain.value = false;
    }
  } catch {
    if (current(own)) error.value = localization.t('AbpUi::ErrorLoadingDatatable');
  } finally {
    if (current(own)) loading.value = false;
  }
}
async function setSection(value: string) {
  if (busy.value) return;
  section.value = value;
  filter.value = '';
  page.value = 0;
  await router.replace({ query: { ...route.query, section: value } });
  await load();
}
async function run(action: () => Promise<unknown>, reload = true) {
  if (blocked.value) return;
  const own = revision;
  busy.value = true;
  error.value = '';
  notice.value = '';
  try {
    await action();
    if (!current(own)) return;
    busy.value = false;
    notice.value = localization.t('AbpUi::SavedSuccessfully');
    if (reload) await load();
  } catch {
    if (current(own)) {
      uncertain.value = true;
      error.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
  } finally {
    if (current(own)) busy.value = false;
  }
}
async function beginLink() {
  if (!linkTarget.value.trim()) return;
  await run(() => workflow.beginLink(linkTarget.value), false);
}
async function loginAs(record: LinkUserDto) {
  if (
    !links.value.some(
      item =>
        item.targetUserId === record.targetUserId && item.targetTenantId === record.targetTenantId,
    )
  )
    return;
  await run(() => workflow.loginAs(record), false);
}
async function unlink(record: LinkUserDto) {
  const own = revision;
  if (blocked.value || !record.directlyLinked || !links.value.includes(record)) return;
  confirming.value = true;
  const status = await confirmation.warn(
    'AbpAccount::DeleteLinkAccountConfirmationMessage',
    'AbpUi::AreYouSure',
    { messageLocalizationParams: [record.targetUserName ?? ''] },
  );
  confirming.value = false;
  if (status === 'confirm' && current(own))
    await run(() =>
      linkService.unlink(
        { userId: record.targetUserId, tenantId: record.targetTenantId },
        request(),
      ),
    );
}
async function lookup() {
  if (blocked.value || lookupLoading.value) return;
  const own = revision;
  const lookupOwn = ++lookupRevision;
  lookupLoading.value = true;
  targetUserId.value = '';
  try {
    const result = await delegationService.getUserLookup(
      { userName: lookupFilter.value.trim() },
      request(),
    );
    if (current(own) && lookupOwn === lookupRevision) lookupUsers.value = result.items ?? [];
  } catch {
    if (current(own) && lookupOwn === lookupRevision)
      error.value = localization.t('AbpUi::ErrorLoadingDatatable');
  } finally {
    if (current(own) && lookupOwn === lookupRevision) lookupLoading.value = false;
  }
}
async function delegate() {
  if (
    blocked.value ||
    lookupLoading.value ||
    !lookupUsers.value.some(item => item.id === targetUserId.value) ||
    targetUserId.value === currentUser.value.id
  )
    return;
  const start = Date.parse(startTime.value ?? '');
  const end = Date.parse(endTime.value ?? '');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    error.value = localization.t('AbpAccount::Volo.Account:StartTimeMustBeLessThanEndTime');
    return;
  }
  await run(() =>
    delegationService.delegateNewUser(
      {
        targetUserId: targetUserId.value,
        startTime:
          config.snapshot().clock.kind === 'Utc'
            ? new Date(start).toISOString()
            : (startTime.value ?? ''),
        endTime:
          config.snapshot().clock.kind === 'Utc'
            ? new Date(end).toISOString()
            : (endTime.value ?? ''),
      },
      request(),
    ),
  );
}
async function deleteDelegation(record: UserDelegationDto) {
  const own = revision;
  const id = record.id;
  if (!id || blocked.value || !outgoing.value.includes(record)) return;
  confirming.value = true;
  const status = await confirmation.warn(
    'AbpAccount::DeleteUserDelegationConfirmationMessage',
    'AbpUi::AreYouSure',
    { messageLocalizationParams: [record.userName ?? ''] },
  );
  confirming.value = false;
  if (status === 'confirm' && current(own))
    await run(() => delegationService.deleteDelegation(id, request()));
}
function recordStatus(record: UserDelegationDto) {
  if (delegationDirection.value === 'incoming' && activeDelegationIds.value.has(record.id))
    return 'AbpIdentity::StatusActive';
  const status = delegationStatus(record.startTime, record.endTime, now.value);
  if (delegationDirection.value === 'incoming' && status === 'Active')
    return 'AbpIdentity::NotActive';
  return {
    Active: 'AbpIdentity::StatusActive',
    Future: 'AbpIdentity::StatusFuture',
    Expired: 'AbpIdentity::StatusExpired',
  }[status];
}
async function useDelegation(record: UserDelegationDto) {
  const id = record.id;
  if (
    !id ||
    isImpersonating.value ||
    !incoming.value.includes(record) ||
    !activeDelegationIds.value.has(record.id)
  )
    return;
  await run(() => workflow.useDelegation(id), false);
}
function isCurrentTenant(record: UserSharingDto) {
  return (record.tenantId ?? null) === (currentTenant.value.id ?? null);
}
async function switchTenant(record: UserSharingDto) {
  if (
    isImpersonating.value ||
    !shared.value ||
    isCurrentTenant(record) ||
    !tenants.value.includes(record)
  )
    return;
  await run(
    () =>
      workflow.switchTenant(
        record.tenantId
          ? { id: record.tenantId, name: record.tenantName ?? null, isAvailable: true }
          : null,
      ),
    false,
  );
}
async function leave(record: UserSharingDto) {
  const own = revision;
  if (
    blocked.value ||
    !shared.value ||
    isImpersonating.value ||
    isCurrentTenant(record) ||
    !tenants.value.includes(record)
  )
    return;
  confirming.value = true;
  const status = await confirmation.warn(
    'AbpAccount::AreYouSureYouWantToLeaveTenant',
    'AbpUi::AreYouSure',
    {
      messageLocalizationParams: [
        record.tenantName || localization.t('AbpAccount::HostDisplayName'),
      ],
    },
  );
  confirming.value = false;
  if (status !== 'confirm' || !current(own)) return;
  await run(() => sharingService.leave({ tenantId: record.tenantId }, request()));
}
async function returnToImpersonator() {
  if (busy.value || !isImpersonating.value) return;
  const own = revision;
  busy.value = true;
  try {
    await workflow.returnToImpersonator();
  } catch {
    if (current(own)) error.value = localization.t('AbpAccount::Volo.Account:ImpersonateError');
  } finally {
    if (current(own)) busy.value = false;
  }
}
async function confirmHandoff() {
  if (busy.value || !handoff.value) return;
  busy.value = true;
  error.value = '';
  try {
    await workflow.confirmHandoff();
  } catch {
    error.value = localization.t('AbpAccount::Volo.Account:InvalidLinkToken');
  } finally {
    if (!disposed) busy.value = false;
  }
}
function cancelHandoff() {
  if (busy.value) return;
  workflow.cancelHandoff();
}
async function signIn() {
  await auth.navigateToLogin('/account/workflows');
}
watch(filter, () => {
  page.value = 0;
});
watch(lookupFilter, () => {
  lookupRevision++;
  lookupUsers.value = [];
  targetUserId.value = '';
  lookupLoading.value = false;
});
watch(
  context,
  () => {
    reset();
    if (authenticated.value) void load();
  },
  { flush: 'sync' },
);
watch(
  () => route.query.section,
  value => {
    if (
      typeof value === 'string' &&
      ['links', 'delegation', 'tenants'].includes(value) &&
      value !== section.value &&
      !busy.value
    ) {
      section.value = value;
      filter.value = '';
      void load();
    }
  },
);
onMounted(async () => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  try {
    const handoff = await workflow.resumeHandoff();
    if (!handoff || authenticated.value) await load();
  } catch {
    error.value = localization.t('AbpAccount::Volo.Account:InvalidLinkToken');
  }
});
onBeforeUnmount(() => {
  workflow.cancelHandoff();
  disposed = true;
  reset();
  if (timer !== undefined) clearInterval(timer);
});
</script>
