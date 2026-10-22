<template>
  <AbpPage title="AbpIdentity::Roles">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <p v-if="permissionRefreshFailed" role="alert">
      {{ localization.t('AbpUi::SavedSuccessfully') }}.
      {{ localization.t('AbpIdentity::Permissions') }}:
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="refreshEffectiveConfiguration">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <p v-if="listFailed" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton
        variant="secondary"
        :disabled="list.requestStatus.value === 'loading'"
        @click="list.getWithoutPageReset"
      >
        {{ localization.t('AbpUi::Refresh') }}
      </AbpButton>
    </p>
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpIdentity::Roles"
      searchable
    />
    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::Roles"
      create-title="AbpIdentity::NewRole"
      :save="save"
    >
      <AbpSpinner v-if="loading" />
      <div v-else-if="loadFailed" role="alert">
        <p>{{ localization.t('AbpUi::ErrorLoadingDatatable') }}</p>
        <AbpButton variant="secondary" @click="show(pendingRole)">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </div>
      <form v-else-if="editor.form.value" ref="editorForm" novalidate @submit.prevent="save">
        <fieldset :disabled="editor.busy.value || !canSave">
          <AbpExtensibleForm :form="editor.form.value" :record="editor.editing.value" />
        </fieldset>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="editor.busy.value" @click="close">{{
          localization.t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton
          v-if="pendingRole"
          variant="secondary"
          outline
          :disabled="editor.busy.value"
          @click="reloadEditor(close)"
          >{{ localization.t('AbpUi::Refresh') }}</AbpButton
        >
        <AbpButton :disabled="!canSave" :loading="editor.busy.value" @click="save">{{
          localization.t('AbpUi::Save')
        }}</AbpButton>
      </template>
    </AbpRecordModal>
    <AbpReplaceable
      v-if="permissionsFor"
      v-model:visible="permissionsOpen"
      :replaceable-key="PermissionManagementComponents.PermissionManagement"
      provider-name="R"
      :provider-key="permissionsFor.name ?? ''"
      :entity-display-name="permissionsFor.name ?? ''"
      hide-badges
    >
      <AbpPermissionManagement
        v-model:visible="permissionsOpen"
        provider-name="R"
        :provider-key="permissionsFor.name ?? ''"
        :entity-display-name="permissionsFor.name ?? ''"
        hide-badges
      />
    </AbpReplaceable>
    <ClaimsDialog
      v-if="claimsFor"
      provider="role"
      :entity-id="claimsFor.id ?? ''"
      :display-name="claimsFor.name"
      @close="claimsFor = undefined"
    />
    <RoleUsersDialog
      v-if="usersOperation"
      :mode="usersOperation.mode"
      :role="usersOperation.role"
      @saved="list.getWithoutPageReset"
      @close="usersOperation = undefined"
    />
  </AbpPage>
</template>

<script setup lang="ts">
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  useRecordEditor,
  type RecordEditor,
} from '@lsw-abpvue/components';
import {
  AbpHttpError,
  AbpReplaceable,
  ConfigStateService,
  inject as injectAbp,
  useListService,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import { IdentityRoleService, type IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpPermissionManagement,
  PermissionManagementComponents,
} from '@lsw-abpvue/permission-management';
import { AbpButton, AbpSpinner, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { IdentityProComponents } from '../enums/components.js';
import { IDENTITY_PRO_ROLES_PAGE } from '../tokens/roles-page.token.js';
import {
  getIdentityRoleFormChanges,
  IdentityRoleEditorStateError,
  serializeIdentityRoleCreate,
  serializeIdentityRoleUpdate,
} from '../utils/role-editor.js';
import ClaimsDialog from './ClaimsDialog.vue';
import RoleUsersDialog from './RoleUsersDialog.vue';

const roles = injectAbp(IdentityRoleService);
const injectHistory = injectAbp(SHOW_ENTITY_HISTORY, { optional: true });
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const listFailed = ref(false);
const permissionRefreshFailed = ref(false);
let contextController = new AbortController();
const list = useListService({ persistKey: IdentityProComponents.Roles });
const { items } = list.hookToQuery(async (query, signal) => {
  const ownContext = contextKey.value;
  const requestSignal = AbortSignal.any([signal, contextController.signal]);
  try {
    const result = await roles.getList(query, { signal: requestSignal, skipHandleError: true });
    if (ownContext !== contextKey.value || requestSignal.aborted)
      return { items: [], totalCount: 0 };
    listFailed.value = false;
    return result;
  } catch (error) {
    if (ownContext === contextKey.value && !requestSignal.aborted) listFailed.value = true;
    throw error;
  }
});
const loading = ref(false);
const loadFailed = ref(false);
const pendingRole = shallowRef<IdentityRoleDto>();
const editorContext = ref('');
const permissionsFor = shallowRef<IdentityRoleDto>();
const permissionsOpen = ref(false);
const claimsFor = shallowRef<IdentityRoleDto>();
const usersOperation = shallowRef<{ mode: 'move' | 'delete'; role: IdentityRoleDto }>();
const editorForm = useTemplateRef<HTMLFormElement>('editorForm');
let revision = 0;
let pending: AbortController | undefined;
const editor: RecordEditor<IdentityRoleDto> = useRecordEditor<IdentityRoleDto>({
  identifier: IdentityProComponents.Roles,
  reload: () => list.getWithoutPageReset(),
  create: createRole,
  update: updateRole,
  delete: id => roles.delete(id),
  idOf: role => role.id,
  stampOf: role => role.concurrencyStamp,
  nameOf: role => role.name ?? '',
  deletionMessage: 'AbpIdentity::RoleDeletionConfirmationMessage',
  providers: [
    {
      provide: IDENTITY_PRO_ROLES_PAGE,
      useValue: {
        add: () => {
          void show();
        },
        edit: (role: IdentityRoleDto) => show(role),
        remove: (role: IdentityRoleDto) => showUsers('delete', role),
        moveAllUsers: (role: IdentityRoleDto) => showUsers('move', role),
        managePermissions,
        manageClaims,
        viewHistory,
      },
    },
  ],
});
const canSave = computed(
  () =>
    editor.open.value &&
    !loading.value &&
    !loadFailed.value &&
    !!editor.form.value &&
    editorContext.value === contextKey.value &&
    permission.isGranted(
      `${IdentityProPolicyNames.Roles} && ${pendingRole.value ? IdentityProPolicyNames.RolesUpdate : IdentityProPolicyNames.RolesCreate}`,
    ),
);

function createRole(): Promise<IdentityRoleDto> {
  const form = editor.form.value;
  if (!canSave.value || !form || editor.editing.value)
    throw new IdentityRoleEditorStateError(
      'The create form is unavailable. Reopen the role editor.',
    );
  return roles.create(
    serializeIdentityRoleCreate(getIdentityRoleFormChanges(form, undefined, editor.injector)),
    { signal: pending?.signal, skipHandleError: true },
  );
}

function updateRole(id: string): Promise<IdentityRoleDto> {
  const form = editor.form.value;
  const record = editor.editing.value;
  if (!canSave.value || !form || !record || record.id !== id)
    throw new IdentityRoleEditorStateError('The edit target has changed. Reopen the role editor.');
  return roles.update(
    id,
    serializeIdentityRoleUpdate(record, getIdentityRoleFormChanges(form, record, editor.injector)),
    { signal: pending?.signal, skipHandleError: true },
  );
}

function resetEditor(): void {
  pending?.abort();
  revision += 1;
  loading.value = false;
  loadFailed.value = false;
  editor.form.value = undefined;
  editor.busy.value = false;
}

async function show(role?: IdentityRoleDto): Promise<void> {
  if (
    editor.busy.value ||
    !permission.isGranted(
      `${IdentityProPolicyNames.Roles} && ${role ? IdentityProPolicyNames.RolesUpdate : IdentityProPolicyNames.RolesCreate}`,
    )
  )
    return;
  resetEditor();
  pendingRole.value = role;
  editor.editing.value = role;
  editor.open.value = true;
  editorContext.value = contextKey.value;
  pending = new AbortController();
  const request = pending;
  const own = revision;
  if (!role) {
    editor.show();
    return;
  }
  loading.value = true;
  try {
    if (!role.id) {
      loadFailed.value = true;
      return;
    }
    const fresh = await roles.get(role.id, { signal: request.signal, skipHandleError: true });
    if (own !== revision || request.signal.aborted || !editor.open.value) return;
    if (fresh.id !== role.id) {
      loadFailed.value = true;
      return;
    }
    editor.show({ ...fresh, extraProperties: { ...fresh.extraProperties } });
  } catch {
    if (own === revision && !request.signal.aborted) loadFailed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}

async function reloadEditor(close: () => Promise<void>): Promise<void> {
  if (!pendingRole.value || editor.busy.value) return;
  const role = pendingRole.value;
  const ownContext = contextKey.value;
  await close();
  if (editor.open.value || ownContext !== contextKey.value) return;
  await nextTick();
  await show(role);
}

async function save(): Promise<void> {
  const form = editor.form.value;
  if (!canSave.value || !form || editor.busy.value) return;
  if (!form.form.validate()) {
    await nextTick();
    editorForm.value?.querySelector<HTMLElement>('[aria-invalid="true"]:not([disabled])')?.focus();
    return;
  }
  const own = revision;
  const record = editor.editing.value;
  editor.busy.value = true;
  try {
    if (record?.id) await updateRole(record.id);
    else await createRole();
    if (own !== revision || editorContext.value !== contextKey.value || !canSave.value) return;
    editor.open.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    list.getWithoutPageReset();
    if (record?.name && config.snapshot().currentUser.roles.includes(record.name))
      await refreshEffectiveConfiguration();
  } catch (error) {
    if (own !== revision || pending?.signal.aborted) return;
    form.form.setServerErrors(
      error instanceof AbpHttpError && error.error?.validationErrors?.length
        ? error.error.validationErrors
        : [
            {
              message: localization.t('AbpUi::ErrorLoadingDatatable'),
              members: [],
            },
          ],
    );
  } finally {
    if (own === revision) editor.busy.value = false;
  }
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

function managePermissions(role: IdentityRoleDto): void {
  if (
    !role.name ||
    !permission.isGranted(
      `${IdentityProPolicyNames.Roles} && ${IdentityProPolicyNames.RolesManagePermissions}`,
    )
  )
    return;
  permissionsFor.value = role;
  permissionsOpen.value = true;
}
function manageClaims(role: IdentityRoleDto): void {
  if (
    role.id &&
    permission.isGranted(`${IdentityProPolicyNames.Roles} && ${IdentityProPolicyNames.RolesUpdate}`)
  )
    claimsFor.value = role;
}
function viewHistory(role: IdentityRoleDto): void {
  if (role.id && permission.isGranted(IdentityProPolicyNames.RolesChangeHistory))
    injectHistory?.(role.id, 'Volo.Abp.Identity.IdentityRole');
}
function showUsers(mode: 'move' | 'delete', role: IdentityRoleDto): void {
  const policy =
    mode === 'delete' ? IdentityProPolicyNames.RolesDelete : IdentityProPolicyNames.RolesUpdate;
  if (
    role.id &&
    !(mode === 'delete' && role.isStatic) &&
    permission.isGranted(`${IdentityProPolicyNames.Roles} && ${policy}`)
  )
    usersOperation.value = { mode, role };
}

watch(
  () => editor.open.value,
  open => {
    if (!open) resetEditor();
  },
);
watch(
  () => config.snapshot().auth.grantedPolicies,
  () => {
    if (!canSave.value && editor.open.value) {
      editor.open.value = false;
      resetEditor();
    }
    if (
      !permission.isGranted(
        `${IdentityProPolicyNames.Roles} && ${IdentityProPolicyNames.RolesManagePermissions}`,
      )
    ) {
      permissionsFor.value = undefined;
      permissionsOpen.value = false;
    }
    if (
      !permission.isGranted(
        `${IdentityProPolicyNames.Roles} && ${IdentityProPolicyNames.RolesUpdate}`,
      )
    )
      claimsFor.value = undefined;
  },
  { flush: 'sync' },
);
watch(
  contextKey,
  () => {
    editor.invalidate?.();
    contextController.abort();
    contextController = new AbortController();
    editor.open.value = false;
    resetEditor();
    permissionsFor.value = undefined;
    permissionsOpen.value = false;
    claimsFor.value = undefined;
    usersOperation.value = undefined;
    listFailed.value = false;
    list.get();
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => {
  resetEditor();
  contextController.abort();
});
</script>
