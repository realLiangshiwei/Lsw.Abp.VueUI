<template>
  <AbpPage title="AbpIdentity::Users">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>
    <p v-if="permissionRefreshFailed" role="alert">
      {{ localization.t('AbpUi::SavedSuccessfully') }}
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="refreshEffectiveConfiguration">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <UserAdvancedFilters
      :model-value="advancedFilters"
      :context-key="contextKey"
      @apply="applyFilters"
    />
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpIdentity::Users"
      searchable
    />

    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::Users"
      create-title="AbpIdentity::NewUser"
      size="lg"
      :dirty="dirty"
      :save="save"
    >
      <template #header>
        <h2 class="h5 mb-0">{{ $t(pendingUser ? 'AbpUi::Edit' : 'AbpIdentity::NewUser') }}</h2>
      </template>
      <AbpSpinner v-if="loader.state.value.status === 'loading'" />
      <div v-else-if="loadError" role="alert">
        <p>{{ loadError }}</p>
        <AbpButton variant="secondary" @click="show(pendingUser)">
          {{ $t('AbpUi::Refresh') }}
        </AbpButton>
      </div>
      <form
        v-else-if="snapshot && editor.form.value"
        ref="editorForm"
        novalidate
        @submit.prevent="save"
      >
        <p v-if="writeUncertain" role="alert">{{ writeMessage }}</p>
        <p v-else-if="!canSave" role="alert">{{ $t('AbpExceptionHandling::403MessageDetail') }}</p>
        <fieldset :disabled="editor.busy.value || !canSave">
          <AbpTabList
            v-model="tab"
            :items="tabs"
            orientation="horizontal"
            :aria-label="$t('AbpIdentity::Users')"
          />
          <div role="tabpanel" class="abp-tabs__panel">
            <AbpExtensibleForm
              v-show="tab === 'details'"
              :form="editor.form.value"
              :record="editor.editing.value"
            />
            <div v-if="tab === 'roles' && permissions.manageRoles">
              <p v-if="roles.length === 0">{{ $t('AbpUi::NoDataAvailableInDatatable') }}</p>
              <AbpToggle
                v-for="role in roles"
                :key="role.id"
                :model-value="
                  selectedRoles.includes(role.name ?? '') || inheritedRoleIds.includes(role.id)
                "
                :label="`${role.name ?? ''}${inheritedRoleIds.includes(role.id) ? ` (${localization.t('AbpIdentity::OrganizationUnits')})` : ''}`"
                :title="
                  inheritedRoleIds.includes(role.id)
                    ? $t('AbpIdentity::OrganizationUnits')
                    : undefined
                "
                :disabled="
                  editor.busy.value ||
                  inheritedRoleIds.includes(role.id) ||
                  !snapshot.assignableRoles.some(available => available.id === role.id)
                "
                @update:model-value="toggleRole(role.name, $event === true)"
              />
            </div>
            <div v-if="tab === 'organization-units' && permissions.manageOrganizationUnits">
              <p v-if="organizationUnits.length === 0">
                {{ $t('AbpUi::NoDataAvailableInDatatable') }}
              </p>
              <OrganizationUnitChecklist
                :items="organizationUnits"
                :selected="selectedOrganizationUnits"
                :selectable="
                  snapshot.availableOrganizationUnits.flatMap(unit => (unit.id ? [unit.id] : []))
                "
                :disabled="editor.busy.value"
                @toggle="toggleOrganizationUnit"
              />
            </div>
          </div>
        </fieldset>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="editor.busy.value" @click="close">
          {{ $t('AbpUi::Cancel') }}
        </AbpButton>
        <AbpButton
          v-if="snapshot?.mode === 'edit' || writeUncertain"
          variant="secondary"
          outline
          :disabled="editor.busy.value"
          @click="reloadEditor(close)"
        >
          {{ $t('AbpUi::Refresh') }}
        </AbpButton>
        <AbpButton
          variant="primary"
          :loading="editor.busy.value"
          :disabled="!canSave"
          @click="save"
        >
          {{ $t('AbpUi::Save') }}
        </AbpButton>
      </template>
    </AbpRecordModal>

    <AbpReplaceable
      v-if="permissionsFor"
      v-model:visible="permissionsOpen"
      :replaceable-key="PermissionManagementComponents.PermissionManagement"
      provider-name="U"
      :provider-key="permissionsFor.id ?? ''"
      :entity-display-name="permissionsFor.userName ?? ''"
      :hide-badges="false"
    >
      <AbpPermissionManagement
        v-model:visible="permissionsOpen"
        provider-name="U"
        :provider-key="permissionsFor.id ?? ''"
        :entity-display-name="permissionsFor.userName ?? ''"
      />
    </AbpReplaceable>
    <ClaimsDialog
      v-if="claimsFor"
      provider="user"
      :entity-id="claimsFor.id ?? ''"
      :display-name="claimsFor.userName"
      @close="claimsFor = undefined"
    />
    <UserSecurityDialog
      v-if="securitySelection"
      :operation="securitySelection.operation"
      :user="securitySelection.user"
      @saved="list.getWithoutPageReset"
      @close="securitySelection = undefined"
    />
    <UserSessionsDialog
      v-if="sessionsFor && permission.isGranted(IdentityProPolicyNames.Sessions)"
      :user-id="sessionsFor.id ?? ''"
      :display-name="sessionsFor.userName"
      @close="sessionsFor = undefined"
    />
    <InviteUsersDialog
      v-if="invitationTab && mayInvite"
      :initial-tab="invitationTab"
      :app-name="accountOptions.appName"
      @saved="list.getWithoutPageReset"
      @close="invitationTab = undefined"
    />
    <ImportExternalUserDialog
      v-if="externalOpen && mayImport"
      @saved="list.getWithoutPageReset"
      @close="externalOpen = false"
    />
    <RemoveUserFromTenantDialog
      v-if="membershipUserId"
      :user-id="membershipUserId"
      @saved="list.getWithoutPageReset"
      @close="membershipUserId = undefined"
    />
    <UserDetailsDialog
      v-if="detailsUserId && mayViewDetails"
      :user-id="detailsUserId"
      @close="detailsUserId = undefined"
    />
    <UserFindDialog v-if="findOpen && mayFind" @found="foundUser" @close="findOpen = false" />
    <UserImportDialog
      v-if="importOpen && mayImport"
      :list-refresh-failed="importListRefreshFailed"
      :list-refreshing="list.requestStatus.value === 'loading'"
      @imported="refreshImportedUsers"
      @refresh-list="refreshImportedUsers"
      @close="importOpen = false"
    />
    <AbpModal
      v-if="exportOpen && mayExport"
      :visible="true"
      :dirty="false"
      suppress-unsaved-changes-warning
      @update:visible="$event || closeExport()"
    >
      <template #header>{{ $t('AbpIdentity::Export') }}</template>
      <p v-if="!exportReady" role="status">
        {{ localization.t('AbpUi::LoadingWithThreeDot') }}
        <AbpButton
          variant="secondary"
          :disabled="list.requestStatus.value === 'loading'"
          @click="list.getWithoutPageReset"
        >
          {{ $t('AbpUi::Refresh') }}
        </AbpButton>
      </p>
      <div v-if="exporter.state.value.status === 'error'" role="alert">
        <p>
          {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
        </p>
        <AbpButton
          variant="secondary"
          :disabled="!exportReady"
          @click="lastExportFormat && runExport(lastExportFormat)"
        >
          {{ $t('AbpUi::Refresh') }}
        </AbpButton>
      </div>
      <div class="d-flex gap-2">
        <AbpButton
          :disabled="!exportReady || exporting"
          :loading="exporting && lastExportFormat === 'excel'"
          @click="runExport('excel')"
          >{{ $t('AbpIdentity::ToExcel') }}</AbpButton
        >
        <AbpButton
          :disabled="!exportReady || exporting"
          :loading="exporting && lastExportFormat === 'csv'"
          @click="runExport('csv')"
          >{{ $t('AbpIdentity::ToCSV') }}</AbpButton
        >
      </div>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline @click="close">{{ $t('AbpUi::Cancel') }}</AbpButton>
      </template>
    </AbpModal>
  </AbpPage>
</template>

<script setup lang="ts">
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  AbpTabList,
  useRecordEditor,
  type RecordEditor,
} from '@lsw-abpvue/components';
import {
  AbpHttpError,
  AbpReplaceable,
  ConfigStateService,
  EnvironmentService,
  getCurrentInjector,
  HttpErrorReporterService,
  WindowService,
  inject as injectAbp,
  useListService,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityComponents } from '@lsw-abpvue/identity';
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import { AccountWorkflowsService } from '@lsw-abpvue/account-pro';
import { ACCOUNT_PRO_OPTIONS } from '@lsw-abpvue/account-pro/config';
import { useRouter } from 'vue-router';
import {
  IdentityUserService,
  type GetIdentityUsersInput,
  type IdentityRoleDto,
  type IdentityUserDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpPermissionManagement,
  PermissionManagementComponents,
} from '@lsw-abpvue/permission-management';
import {
  AbpButton,
  AbpModal,
  AbpSpinner,
  AbpToggle,
  useToaster,
  useConfirmation,
  ConfirmationStatus,
} from '@lsw-abpvue/theme-shared';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import type { UserSecurityOperation } from '../models/user-security.js';
import type { IdentityUserAdvancedFilters } from '../models/user-filters.js';
import type { IdentityUserExportFormat } from '../models/user-export.js';
import {
  IDENTITY_PRO_USER_FORM_VALUES,
  IDENTITY_PRO_USERS_PAGE,
} from '../tokens/users-page.token.js';
import {
  createIdentityUserEditorLoader,
  getIdentityUserFormChanges,
  getIdentityUserInheritedRoleIds,
  getIdentityUserInitialSelection,
  IdentityUserEditorStateError,
  refreshIdentityUserFormState,
  serializeIdentityUserCreate,
  serializeIdentityUserUpdate,
  type IdentityUserEditorSnapshot,
} from '../utils/user-editor.js';
import {
  canDeleteUser,
  canInviteUsers,
  canImpersonateUser,
} from '../utils/user-operation-policy.js';
import {
  buildIdentityUserListQuery,
  createIdentityUserAdvancedFilters,
  normalizeIdentityUserAdvancedFilters,
} from '../utils/user-filters.js';
import OrganizationUnitChecklist from './OrganizationUnitChecklist.vue';
import UserSecurityDialog from './UserSecurityDialog.vue';
import UserSessionsDialog from './UserSessionsDialog.vue';
import UserAdvancedFilters from './UserAdvancedFilters.vue';
import UserDetailsDialog from './UserDetailsDialog.vue';
import UserFindDialog from './UserFindDialog.vue';
import ClaimsDialog from './ClaimsDialog.vue';
import UserImportDialog from './UserImportDialog.vue';
import InviteUsersDialog from './InviteUsersDialog.vue';
import ImportExternalUserDialog from './ImportExternalUserDialog.vue';
import RemoveUserFromTenantDialog from './RemoveUserFromTenantDialog.vue';
import { createIdentityUserExportController } from '../utils/user-export.js';

const users = injectAbp(IdentityUserService);
const config = injectAbp(ConfigStateService);
const accountOptions = injectAbp(ACCOUNT_PRO_OPTIONS);
const environment = injectAbp(EnvironmentService);
const injector = getCurrentInjector();
const confirmation = useConfirmation();
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const errorReporter = injectAbp(HttpErrorReporterService);
const browser = injectAbp(WindowService);
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
let listContext = new AbortController();
const advancedFilters = shallowRef(createIdentityUserAdvancedFilters());
const successfulQuery = shallowRef<GetIdentityUsersInput>();
const permissionRefreshFailed = ref(false);
const claimsFor = shallowRef<IdentityUserDto>();
const importOpen = ref(false);
const importResultActive = ref(false);
const importListRefreshFailed = ref(false);
const list = useListService({ persistKey: IdentityComponents.Users });
const currentQuery = computed(() =>
  buildIdentityUserListQuery(list.query.value, advancedFilters.value),
);
const { items } = list.hookToQuery(async (query, signal) => {
  const contextBeforeRead = contextKey.value;
  const requestSignal = AbortSignal.any([signal, listContext.signal]);
  try {
    const requested = structuredClone(buildIdentityUserListQuery(query, advancedFilters.value));
    const result = await users.getList(requested, {
      signal: requestSignal,
      skipHandleError: true,
    });
    if (contextBeforeRead === contextKey.value && !requestSignal.aborted) {
      successfulQuery.value = requested;
      importListRefreshFailed.value = false;
    }
    return contextBeforeRead === contextKey.value ? result : { items: [], totalCount: 0 };
  } catch (error: unknown) {
    if (contextBeforeRead !== contextKey.value) return { items: [], totalCount: 0 };
    if (!requestSignal.aborted && error instanceof AbpHttpError) {
      if (importOpen.value && importResultActive.value) importListRefreshFailed.value = true;
      else errorReporter.reportError(error);
    }
    throw error;
  }
});
let lockoutTimer: ReturnType<typeof setTimeout> | undefined;
watch(items, rows => {
  clearTimeout(lockoutTimer);
  const now = Date.now();
  const next = Math.min(
    ...rows
      .map(row => Date.parse(row.lockoutEnd ?? ''))
      .filter(end => Number.isFinite(end) && end > now),
  );
  if (Number.isFinite(next))
    lockoutTimer = setTimeout(
      () => list.getWithoutPageReset(),
      Math.min(next - now + 50, 2_147_483_647),
    );
});
const loader = createIdentityUserEditorLoader(users);
const snapshot = shallowRef<IdentityUserEditorSnapshot>();
const pendingUser = shallowRef<IdentityUserDto>();
const noInitializationError = Symbol();
const initializationError = shallowRef<unknown>(noInitializationError);
const editorForm = useTemplateRef<HTMLFormElement>('editorForm');
const writeUncertain = ref(false);
const writeMessage = ref('');
let submittedUserName = '';
let submittedDraft = '';
const editorContext = ref('');
const selectedRoles = ref<string[]>([]);
const selectedOrganizationUnits = ref<string[]>([]);
const initialRoles = shallowRef<readonly string[]>([]);
const initialOrganizationUnits = shallowRef<readonly string[]>([]);
const tab = ref('details');
const permissionsFor = shallowRef<IdentityUserDto>();
const permissionsOpen = ref(false);
const securitySelection = shallowRef<{ operation: UserSecurityOperation; user: IdentityUserDto }>();
const sessionsFor = shallowRef<IdentityUserDto>();
const invitationTab = ref<'invite' | 'pending'>();
const externalOpen = ref(false);
const membershipUserId = ref<string>();
const mayInvite = computed(
  () =>
    permission.isGranted(IdentityProPolicyNames.UsersCreate) && canInviteUsers(config.snapshot()),
);
const router = useRouter();
const showHistory = injectAbp(SHOW_ENTITY_HISTORY, { optional: true });
const detailsUserId = ref<string>();
const mayViewDetails = computed(() =>
  permission.isGranted(IdentityProPolicyNames.UsersViewDetails),
);
const mayFind = computed(() =>
  permission.isGranted(
    `${IdentityProPolicyNames.Users} && ${IdentityProPolicyNames.UsersViewDetails}`,
  ),
);
const mayExport = computed(() =>
  permission.isGranted(`${IdentityProPolicyNames.Users} && ${IdentityProPolicyNames.UsersExport}`),
);
const mayImport = computed(() =>
  permission.isGranted(`${IdentityProPolicyNames.Users} && ${IdentityProPolicyNames.UsersImport}`),
);
const findOpen = ref(false);
const exportOpen = ref(false);
const lastExportFormat = ref<IdentityUserExportFormat>();
let exportRevision = 0;
const exporter = createIdentityUserExportController(users, (blob, fileName) =>
  browser.downloadBlob(blob, fileName),
);
const exporting = computed(() => exporter.state.value.status === 'loading');
const exportReady = computed(
  () =>
    mayExport.value &&
    list.requestStatus.value === 'success' &&
    successfulQuery.value !== undefined &&
    JSON.stringify(successfulQuery.value) === JSON.stringify(currentQuery.value),
);
const permissions = computed(() => ({
  manageRoles: permission.isGranted(IdentityProPolicyNames.UsersManageRoles),
  manageOrganizationUnits: permission.isGranted(IdentityProPolicyNames.UsersManageOU),
}));

function currentSnapshot(): IdentityUserEditorSnapshot {
  const current = snapshot.value;
  if (!current || !canSave.value) {
    throw new IdentityUserEditorStateError(
      'The user editor is no longer ready. Reload it before saving.',
    );
  }
  return current;
}

const editor: RecordEditor<IdentityUserDto> = useRecordEditor<IdentityUserDto>({
  identifier: IdentityComponents.Users,
  reload: () => list.getWithoutPageReset(),
  create: () => {
    const current = currentSnapshot();
    const form = editor.form.value;
    if (current.mode !== 'create' || !form) {
      throw new IdentityUserEditorStateError('The create form is unavailable. Reopen the editor.');
    }
    const body = serializeForEditor(() =>
      serializeIdentityUserCreate(
        current,
        getIdentityUserFormChanges(form, undefined, editor.injector),
        { roleNames: selectedRoles.value, organizationUnitIds: selectedOrganizationUnits.value },
      ),
    );
    submittedUserName = body.userName;
    submittedDraft = draftSignature();
    return observeWrite(users.create(body, { signal: listContext.signal }));
  },
  update: id => {
    const current = currentSnapshot();
    const form = editor.form.value;
    if (current.mode !== 'edit' || current.user.id !== id || !form) {
      throw new IdentityUserEditorStateError('The edit target has changed. Reopen the editor.');
    }
    const changes = getIdentityUserFormChanges(form, current.user, editor.injector);
    const body = serializeForEditor(() =>
      serializeIdentityUserUpdate(current, changes, {
        roleNames: selectedRoles.value,
        organizationUnitIds: selectedOrganizationUnits.value,
      }),
    );
    if (
      body.roleNames !== undefined &&
      body.organizationUnitIds === undefined &&
      changes.writableFields.length === 0 &&
      changes.writableExtraProperties.length === 0
    )
      return observeWrite(
        users.updateRoles(id, { roleNames: body.roleNames }, { signal: listContext.signal }),
      ).then(() => current.user);
    return observeWrite(users.update(id, body, { signal: listContext.signal }));
  },
  delete: async id => {
    const contextBeforeRead = contextKey.value;
    const controller = listContext;
    const user = await users.get(id, { signal: controller.signal });
    if (
      contextBeforeRead !== contextKey.value ||
      controller !== listContext ||
      user.id?.toLowerCase() !== id.toLowerCase() ||
      !permission.isGranted(IdentityProPolicyNames.UsersDelete) ||
      !canDeleteUser(user, config.snapshot())
    ) {
      toaster.error('AbpExceptionHandling::403MessageDetail');
      throw new IdentityUserEditorStateError('Deleting this user is no longer permitted.');
    }
    return users.delete(id, { signal: controller.signal });
  },
  idOf: user => user.id,
  stampOf: user => user.concurrencyStamp,
  nameOf: user => user.userName ?? '',
  deletionMessage: 'AbpIdentity::UserDeletionConfirmationMessage',
  providers: [
    {
      provide: IDENTITY_PRO_USERS_PAGE,
      useValue: {
        add: () => show(),
        findUser: showFind,
        exportUsers: showExport,
        importUsers: showImport,
        importExternalUser: () => {
          if (mayImport.value) externalOpen.value = true;
        },
        inviteUsers: () => {
          if (mayInvite.value) invitationTab.value = 'invite';
        },
        pendingInvitations: () => {
          if (mayInvite.value) invitationTab.value = 'pending';
        },
        removeFromTenant: async (user: IdentityUserDto) => {
          membershipUserId.value = user.id;
        },
        impersonate,
        viewDetails,
        edit: (user: IdentityUserDto) => show(user),
        remove,
        managePermissions,
        manageClaims,
        manageSessions,
        viewSecurityLogs,
        viewHistory,
        lock: (user: IdentityUserDto) => showSecurity('lock', user),
        unlock: (user: IdentityUserDto) => showSecurity('unlock', user),
        setPassword: (user: IdentityUserDto) => showSecurity('password', user),
        manageTwoFactor: (user: IdentityUserDto) => showSecurity('two-factor', user),
      },
    },
    {
      provide: IDENTITY_PRO_USER_FORM_VALUES,
      useValue: () => editor.form.value?.form.value ?? {},
    },
  ],
});

const canSave = computed(() => {
  const current = snapshot.value;
  return Boolean(
    current &&
    !writeUncertain.value &&
    editorContext.value === contextKey.value &&
    loader.state.value.status === 'ready' &&
    editor.form.value &&
    permissions.value.manageRoles === current.permissions.manageRoles &&
    permissions.value.manageOrganizationUnits === current.permissions.manageOrganizationUnits &&
    permission.isGranted(
      current.mode === 'edit'
        ? IdentityProPolicyNames.UsersUpdate
        : IdentityProPolicyNames.UsersCreate,
    ),
  );
});
const tabs = computed(() => [
  { name: 'details', text: 'AbpIdentity::UserInformations' },
  ...(permissions.value.manageRoles
    ? [
        {
          name: 'roles',
          text: `${localization.t('AbpIdentity::Roles')} (${roles.value.filter(role => selectedRoles.value.includes(role.name ?? '') || inheritedRoleIds.value.includes(role.id)).length})`,
        },
      ]
    : []),
  ...(permissions.value.manageOrganizationUnits
    ? [
        {
          name: 'organization-units',
          text: `${localization.t('AbpIdentity::OrganizationUnits')} (${selectedOrganizationUnits.value.length})`,
        },
      ]
    : []),
]);
const roles = computed(() => {
  const current = snapshot.value;
  if (!current) return [];
  const found = new Map<string, IdentityRoleDto>();
  for (const role of [
    ...current.assignableRoles,
    ...(current.mode === 'edit' ? current.assignedRoles : []),
    ...current.availableOrganizationUnits
      .filter(unit => unit.id !== undefined && selectedOrganizationUnits.value.includes(unit.id))
      .flatMap(unit => unit.roles ?? []),
  ]) {
    if (role.id) found.set(role.id, role);
  }
  return [...found.values()].flatMap(role => (role.id ? [{ ...role, id: role.id }] : []));
});
const inheritedRoleIds = computed(() =>
  snapshot.value
    ? getIdentityUserInheritedRoleIds(snapshot.value, [
        ...selectedOrganizationUnits.value,
        ...(snapshot.value.mode === 'edit'
          ? snapshot.value.assignedOrganizationUnits.flatMap(unit => (unit.id ? [unit.id] : []))
          : []),
      ])
    : [],
);
const organizationUnits = computed(() => {
  const current = snapshot.value;
  if (!current) return [];
  const available = [...current.availableOrganizationUnits];
  return [
    ...available,
    ...(current.mode === 'edit'
      ? current.assignedOrganizationUnits.filter(
          unit => !available.some(item => item.id === unit.id),
        )
      : []),
  ].flatMap(unit =>
    unit.id ? [{ id: unit.id, parentId: unit.parentId, displayName: unit.displayName }] : [],
  );
});
const loadError = computed(() => {
  const state = loader.state.value;
  const error = state.status === 'error' ? state.error : initializationError.value;
  if (error === noInitializationError) return '';
  const message = error instanceof AbpHttpError ? error.error?.message : undefined;
  return typeof message === 'string' && message.trim()
    ? message
    : localization.t('AbpUi::ErrorLoadingDatatable');
});
const changed = (before: readonly string[], after: readonly string[]): boolean =>
  before.length !== after.length || before.some(value => !after.includes(value));
const dirty = computed(() =>
  Boolean(
    editor.form.value?.form.dirty ||
    changed(initialRoles.value, selectedRoles.value) ||
    changed(initialOrganizationUnits.value, selectedOrganizationUnits.value),
  ),
);

async function show(user?: IdentityUserDto): Promise<void> {
  if (
    editor.busy.value ||
    !permission.isGranted(
      user ? IdentityProPolicyNames.UsersUpdate : IdentityProPolicyNames.UsersCreate,
    )
  )
    return;
  loader.reset();
  editorContext.value = contextKey.value;
  initializationError.value = noInitializationError;
  writeUncertain.value = false;
  writeMessage.value = '';
  snapshot.value = undefined;
  pendingUser.value = user;
  editor.editing.value = user;
  editor.form.value = undefined;
  selectedRoles.value = [];
  selectedOrganizationUnits.value = [];
  initialRoles.value = [];
  initialOrganizationUnits.value = [];
  tab.value = 'details';
  editor.open.value = true;
  try {
    const loaded = await loader.load(user?.id, permissions.value);
    if (!loaded || !editor.open.value) return;
    snapshot.value = loaded;
    const selected = getIdentityUserInitialSelection(loaded);
    selectedRoles.value = [...(selected.roleNames ?? [])];
    selectedOrganizationUnits.value = [...(selected.organizationUnitIds ?? [])];
    initialRoles.value = [...selectedRoles.value];
    initialOrganizationUnits.value = [...selectedOrganizationUnits.value];
    editor.show(loaded.mode === 'edit' ? loaded.user : undefined);
  } catch (error: unknown) {
    initializationError.value = error;
    snapshot.value = undefined;
    editor.form.value = undefined;
  }
}

function serializeForEditor<T>(serialize: () => T): T {
  try {
    return serialize();
  } catch (error: unknown) {
    editor.form.value?.form.setServerErrors([
      {
        message: localization.t('AbpValidation::ThisFieldIsNotValid.'),
        members: [],
      },
    ]);
    throw error;
  }
}

async function reloadEditor(close: () => Promise<void>): Promise<void> {
  const user = pendingUser.value;
  const contextBeforeClose = editorContext.value;
  if (editor.busy.value) return;
  if (!user && writeUncertain.value) {
    const ownSnapshot = snapshot.value;
    const controller = listContext;
    editor.busy.value = true;
    try {
      if (submittedDraft !== draftSignature()) return;
      const result = await users.getList(
        { userName: submittedUserName, maxResultCount: 1000 },
        { signal: controller.signal },
      );
      if (
        controller !== listContext ||
        contextBeforeClose !== contextKey.value ||
        snapshot.value !== ownSnapshot ||
        submittedDraft !== draftSignature()
      )
        return;
      list.getWithoutPageReset();
      if (result.items?.some(record => record.userName === submittedUserName)) {
        writeMessage.value = localization.t(
          'AbpIdentity::Volo.Abp.Identity:DuplicateUserName',
          submittedUserName,
        );
        return;
      }
      const status = await confirmation.warn('AbpIdentity::NewUser', 'AbpUi::AreYouSure');
      if (
        status === ConfirmationStatus.confirm &&
        controller === listContext &&
        contextBeforeClose === contextKey.value &&
        snapshot.value === ownSnapshot &&
        submittedDraft === draftSignature()
      )
        writeUncertain.value = false;
    } catch {
      // A failed inspection cannot authorize another write.
    } finally {
      if (contextBeforeClose === contextKey.value && snapshot.value === ownSnapshot)
        editor.busy.value = false;
    }
    return;
  }
  if (!user) return;
  await close();
  if (editor.open.value || contextBeforeClose !== contextKey.value) return;
  await nextTick();
  await show(user);
}

function draftSignature(): string {
  return JSON.stringify([
    editor.form.value?.form.value,
    selectedRoles.value,
    selectedOrganizationUnits.value,
  ]);
}

function observeWrite<T>(request: Promise<T>): Promise<T> {
  const ownSnapshot = snapshot.value;
  const ownContext = editorContext.value;
  return request.catch((error: unknown) => {
    if (ownSnapshot === snapshot.value && ownContext === contextKey.value && editor.open.value) {
      writeUncertain.value = true;
      writeMessage.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
    throw error;
  });
}

async function save(): Promise<void> {
  if (editor.busy.value || !canSave.value) return;
  if (!editor.form.value?.form.validate()) {
    tab.value = 'details';
    await nextTick();
    editorForm.value
      ?.querySelector<HTMLElement>(
        'input[aria-invalid="true"]:not([disabled]), textarea[aria-invalid="true"]:not([disabled]), select[aria-invalid="true"]:not([disabled]), [tabindex][aria-invalid="true"]:not([disabled])',
      )
      ?.focus();
    return;
  }
  const ownUser = editor.editing.value?.id === config.snapshot().currentUser.id;
  const context = contextKey.value;
  await editor.save();
  if (ownUser && !editor.open.value && context === contextKey.value)
    await refreshEffectiveConfiguration();
}

async function refreshEffectiveConfiguration(): Promise<void> {
  const context = contextKey.value;
  try {
    await config.refreshAppState();
    if (context === contextKey.value) permissionRefreshFailed.value = false;
  } catch {
    if (context === contextKey.value) permissionRefreshFailed.value = true;
  }
}

function toggleRole(name: string | undefined, checked: boolean): void {
  if (name === undefined || editor.busy.value) return;
  selectedRoles.value = checked
    ? [...new Set([...selectedRoles.value, name])]
    : selectedRoles.value.filter(value => value !== name);
}

function toggleOrganizationUnit(id: string, checked: boolean): void {
  if (editor.busy.value) return;
  selectedOrganizationUnits.value = checked
    ? [...new Set([...selectedOrganizationUnits.value, id])]
    : selectedOrganizationUnits.value.filter(value => value !== id);
}

function manageClaims(user: IdentityUserDto): void {
  if (!permission.isGranted('AbpIdentity.Users && AbpIdentity.Users.Update') || !user.id) return;
  claimsFor.value = user;
}

function manageSessions(user: IdentityUserDto): void {
  if (user.id && permission.isGranted(IdentityProPolicyNames.Sessions)) sessionsFor.value = user;
}

function viewSecurityLogs(user: IdentityUserDto): void {
  if (user.userName && permission.isGranted(IdentityProPolicyNames.SecurityLogs))
    void router.push({ path: '/identity/security-logs', query: { userName: user.userName } });
}

function viewHistory(user: IdentityUserDto): void {
  if (user.id && permission.isGranted(IdentityProPolicyNames.UsersChangeHistory))
    showHistory?.(user.id, 'Volo.Abp.Identity.IdentityUser');
}

async function impersonate(user: IdentityUserDto): Promise<void> {
  const allowed = () =>
    permission.isGranted(IdentityProPolicyNames.UsersImpersonation) &&
    canImpersonateUser(
      user,
      config.snapshot(),
      environment.getEnvironment().oAuthConfig?.impersonation?.userImpersonation === true,
    );
  if (!user.id || !allowed()) return;
  const context = contextKey.value;
  if (
    (await confirmation.warn('AbpIdentity::LoginWithThisUser', 'AbpUi::AreYouSure')) !==
      ConfirmationStatus.confirm ||
    context !== contextKey.value ||
    !allowed()
  )
    return;
  try {
    await injector
      ?.get(AccountWorkflowsService)
      .impersonateUser(user.id, config.snapshot().currentTenant.id);
  } catch {
    toaster.error('AbpUi::ErrorLoadingDatatable');
  }
}

function managePermissions(user: IdentityUserDto): void {
  if (!permission.isGranted(IdentityProPolicyNames.UsersManagePermissions)) return;
  permissionsFor.value = user;
  permissionsOpen.value = true;
}

async function remove(user: IdentityUserDto): Promise<void> {
  if (
    permission.isGranted(IdentityProPolicyNames.UsersDelete) &&
    canDeleteUser(user, config.snapshot())
  ) {
    await editor.remove(user);
  }
}

function showSecurity(operation: UserSecurityOperation, user: IdentityUserDto): void {
  securitySelection.value = { operation, user };
}

function viewDetails(user: IdentityUserDto): void {
  if (mayViewDetails.value && user.id) detailsUserId.value = user.id;
}

function showFind(): void {
  if (mayFind.value) findOpen.value = true;
}

function showImport(): void {
  if (mayImport.value) importOpen.value = true;
}

function refreshImportedUsers(): void {
  if (!importOpen.value || !mayImport.value) return;
  importResultActive.value = true;
  importListRefreshFailed.value = false;
  list.getWithoutPageReset();
}

async function foundUser(userId: string): Promise<void> {
  const context = contextKey.value;
  findOpen.value = false;
  await nextTick();
  if (context === contextKey.value && mayFind.value) detailsUserId.value = userId;
}

function showExport(): void {
  if (!mayExport.value || exportOpen.value) return;
  exportRevision += 1;
  exporter.reset();
  lastExportFormat.value = undefined;
  exportOpen.value = true;
}

function closeExport(): void {
  exportRevision += 1;
  exportOpen.value = false;
  exporter.reset();
}

async function runExport(format: IdentityUserExportFormat): Promise<void> {
  const query = successfulQuery.value;
  if (!exportReady.value || !query || exporting.value || !exportOpen.value) return;
  const session = exportRevision;
  lastExportFormat.value = format;
  try {
    await exporter.export(format, query);
    if (session === exportRevision && exporter.state.value.status === 'idle') closeExport();
  } catch {
    // Export failures stay local; raw HTTP errors may contain the download token URL.
  }
}

function applyFilters(filters: IdentityUserAdvancedFilters): void {
  advancedFilters.value = normalizeIdentityUserAdvancedFilters(filters);
  list.get();
}

watchEffect(() => {
  if (editor.form.value) {
    refreshIdentityUserFormState(editor.form.value, editor.editing.value, editor.injector);
  }
});
watch(editor.open, open => {
  if (open) return;
  loader.reset();
  snapshot.value = undefined;
  editor.form.value = undefined;
  editor.editing.value = undefined;
  pendingUser.value = undefined;
});
watch(
  contextKey,
  () => {
    listContext.abort();
    listContext = new AbortController();
    editor.invalidate?.();
    items.value = [];
    list.totalCount.value = 0;
    successfulQuery.value = undefined;
    permissionRefreshFailed.value = false;
    advancedFilters.value = createIdentityUserAdvancedFilters();
    list.filter.value = '';
    list.get();
    editor.open.value = false;
    securitySelection.value = undefined;
    sessionsFor.value = undefined;
    invitationTab.value = undefined;
    externalOpen.value = false;
    membershipUserId.value = undefined;
    permissionsOpen.value = false;
    claimsFor.value = undefined;
    detailsUserId.value = undefined;
    findOpen.value = false;
    importOpen.value = false;
    closeExport();
  },
  { flush: 'sync' },
);
watch(mayViewDetails, allowed => {
  if (!allowed) detailsUserId.value = undefined;
});
watch(
  () => permission.isGranted(IdentityProPolicyNames.UsersDelete),
  allowed => {
    if (!allowed) editor.invalidate?.();
  },
  { flush: 'sync' },
);
watch(
  mayInvite,
  allowed => {
    if (!allowed) invitationTab.value = undefined;
  },
  { flush: 'sync' },
);
watch(
  mayFind,
  allowed => {
    if (!allowed) findOpen.value = false;
  },
  { flush: 'sync' },
);
watch(
  mayExport,
  allowed => {
    if (!allowed) closeExport();
  },
  { flush: 'sync' },
);
watch(
  mayImport,
  allowed => {
    if (!allowed) importOpen.value = false;
  },
  { flush: 'sync' },
);
watch(
  importOpen,
  open => {
    if (open) return;
    importResultActive.value = false;
    importListRefreshFailed.value = false;
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => {
  clearTimeout(lockoutTimer);
  listContext.abort();
  loader.reset();
  exporter.reset();
});
</script>
