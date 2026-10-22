<template>
  <AbpModal :visible="true" size="lg" :dirty="false" @update:visible="$event || emit('close')">
    <template #header>{{ localization.t('AbpIdentity::ViewDetails') }}</template>

    <AbpSpinner v-if="loader.state.value.status === 'loading'" />
    <div v-else-if="loadError" role="alert">
      <p>{{ loadError }}</p>
      <AbpButton variant="secondary" @click="load">
        {{ localization.t('AbpUi::Refresh') }}
      </AbpButton>
    </div>
    <template v-else-if="snapshot">
      <AbpTabList
        v-model="tab"
        :items="tabs"
        orientation="horizontal"
        :aria-label="localization.t('AbpIdentity::ViewDetails')"
      >
        <template #label="{ item }">
          {{ localization.t(item.text) }}
          <span v-if="item.name === 'organization-units'">
            ({{ assignedOrganizationUnitIds.length }})</span
          >
        </template>
      </AbpTabList>
      <div role="tabpanel" class="abp-tabs__panel">
        <table
          v-if="tab === 'information' || tab === 'general'"
          class="table table-striped align-middle"
        >
          <tbody>
            <tr v-for="row in tab === 'information' ? information : general" :key="row.label">
              <th scope="row">{{ localization.t(row.label) }}</th>
              <td>{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
        <template v-else-if="tab === 'organization-units'">
          <OrganizationUnitChecklist
            v-if="assignedOrganizationUnitIds.length"
            :items="organizationUnits"
            :selected="assignedOrganizationUnitIds"
            :selectable="[]"
            disabled
          />
          <p v-else>{{ localization.t('AbpIdentity::NoOrganizationUnits') }}</p>
        </template>
      </div>
    </template>

    <template #footer="{ close }">
      <AbpButton variant="secondary" outline @click="close">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { AbpTabList } from '@lsw-abpvue/components';
import {
  AbpHttpError,
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  createIdentityUserDetailsLoader,
  formatIdentityUserDetailsDate,
  getIdentityUserDetailsOrganizationUnits,
} from '../utils/user-details.js';
import { isUserLockedOut } from '../utils/user-operation-policy.js';
import OrganizationUnitChecklist from './OrganizationUnitChecklist.vue';

const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ close: [] }>();
const users = injectAbp(IdentityUserService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const permission = usePermission();
const loader = createIdentityUserDetailsLoader(users);
const tab = ref('information');
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const mayView = computed(() => permission.isGranted('AbpIdentity.Users.ViewDetails'));
const snapshot = computed(() => {
  const state = loader.state.value;
  return state.status === 'ready' ? state.snapshot : undefined;
});
const dash = computed(() => localization.t('AbpIdentity::Dash'));
const text = (value: string | null | undefined) => value || dash.value;
const yesNo = (value: boolean | undefined) => localization.t(value ? 'AbpUi::Yes' : 'AbpUi::No');
const date = (value: string | null | undefined) =>
  formatIdentityUserDetailsDate(value, config.snapshot().localization.currentCulture) ?? dash.value;
const assignedOrganizationUnitIds = computed(() => [
  ...new Set(
    snapshot.value?.assignedOrganizationUnits.flatMap(unit => (unit.id ? [unit.id] : [])) ?? [],
  ),
]);
const organizationUnits = computed(() =>
  snapshot.value ? getIdentityUserDetailsOrganizationUnits(snapshot.value) : [],
);
const tabs = [
  { name: 'information', text: 'AbpIdentity::UserInformations' },
  {
    name: 'organization-units',
    text: 'AbpIdentity::OrganizationUnits',
  },
  { name: 'general', text: 'AbpIdentity::General' },
];
const information = computed(() => {
  const user = snapshot.value?.user;
  if (!user) return [];
  return [
    { label: 'AbpIdentity::DisplayName:UserId', value: user.id },
    { label: 'AbpIdentity::UserName', value: text(user.userName) },
    { label: 'AbpIdentity::Name', value: text(user.name) },
    { label: 'AbpIdentity::Surname', value: text(user.surname) },
    { label: 'AbpIdentity::EmailAddress', value: text(user.email) },
    { label: 'AbpIdentity::DisplayName:EmailConfirmed', value: yesNo(user.emailConfirmed) },
    { label: 'AbpIdentity::Roles', value: text(user.roleNames?.join(', ')) },
    { label: 'AbpIdentity::PhoneNumber', value: text(user.phoneNumber) },
    {
      label: 'AbpIdentity::DisplayName:PhoneNumberConfirmed',
      value: yesNo(user.phoneNumberConfirmed),
    },
    { label: 'AbpIdentity::DisplayName:IsActive', value: yesNo(user.isActive) },
  ];
});
const general = computed(() => {
  const current = snapshot.value;
  if (!current) return [];
  const { user } = current;
  return [
    { label: 'AbpIdentity::CreatedBy', value: text(current.creator?.userName) },
    { label: 'AbpIdentity::CreationTime', value: date(user.creationTime) },
    { label: 'AbpIdentity::ModifiedBy', value: text(current.modifier?.userName) },
    { label: 'AbpIdentity::ModificationTime', value: date(user.lastModificationTime) },
    { label: 'AbpIdentity::PasswordUpdateTime', value: date(user.lastPasswordChangeTime) },
    { label: 'AbpIdentity::LockoutEndTime', value: date(user.lockoutEnd) },
    { label: 'AbpIdentity::FailedAccessCount', value: user.accessFailedCount },
    { label: 'AbpIdentity::DisplayName:LockoutEnabled', value: yesNo(user.lockoutEnabled) },
    { label: 'AbpIdentity::Lock', value: yesNo(isUserLockedOut(user)) },
    { label: 'AbpIdentity::IsExternal', value: yesNo(user.isExternal) },
    {
      label: 'AbpIdentity::DisplayName:ShouldChangePasswordOnNextLogin',
      value: yesNo(user.shouldChangePasswordOnNextLogin),
    },
  ];
});
const loadError = computed(() => {
  const state = loader.state.value;
  if (state.status !== 'error') return '';
  const error = state.error;
  const message = error instanceof AbpHttpError ? error.error?.message : undefined;
  return typeof message === 'string' && message.trim()
    ? message
    : localization.t('AbpUi::ErrorLoadingDatatable');
});

async function load(): Promise<void> {
  if (!mayView.value) return;
  try {
    await loader.load(props.userId);
  } catch {
    // The loader retains a visible failure and retry action inside this dialog.
  }
}

watch(
  () => props.userId,
  () => {
    tab.value = 'information';
    void load();
  },
  { immediate: true },
);
watch(contextKey, () => {
  loader.reset();
  emit('close');
});
watch(
  mayView,
  allowed => {
    if (allowed) return;
    loader.reset();
    emit('close');
  },
  { immediate: true },
);
onBeforeUnmount(() => loader.reset());
</script>
