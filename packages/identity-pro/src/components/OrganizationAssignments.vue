<template>
  <section
    :aria-label="localization.t(kind === 'members' ? 'AbpIdentity::Members' : 'AbpIdentity::Roles')"
  >
    <p>{{ selectedOrganizationUnit.displayName }}</p>
    <AbpButton
      v-if="permitted"
      :disabled="busy || configurationFailed || failedWrite"
      @click="openPicker"
    >
      {{ localization.t(kind === 'members' ? 'AbpIdentity::AddMember' : 'AbpIdentity::AddRole') }}
    </AbpButton>
    <p v-if="configurationFailed" role="alert">
      {{ localization.t('AbpUi::SavedSuccessfully') }}.
      {{ localization.t('AbpIdentity::Permissions') }}:
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" :disabled="busy" @click="refreshPermissions()">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <p v-if="listFailed || failedWrite" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" :disabled="busy" @click="refreshAssignments">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <fieldset
      :disabled="
        busy ||
        confirming ||
        configurationFailed ||
        failedWrite ||
        listFailed ||
        candidateFailed ||
        !permitted
      "
    >
      <AbpExtensibleTable
        :data="items"
        :list="list"
        record-key="id"
        :caption="kind === 'members' ? 'AbpIdentity::Members' : 'AbpIdentity::Roles'"
        :searchable="kind === 'members'"
      />
    </fieldset>
    <AbpModal
      v-if="pickerOpen"
      :visible="true"
      :busy="busy"
      :dirty="selectedIds.length > 0"
      @update:visible="$event || closePicker()"
    >
      <template #header>{{
        localization.t(kind === 'members' ? 'AbpIdentity::AddMember' : 'AbpIdentity::AddRole')
      }}</template>
      <p>{{ selectedOrganizationUnit.displayName }}</p>
      <p v-if="candidateFailed || failedWrite" role="alert">
        {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
        <AbpButton variant="secondary" :disabled="busy" @click="refreshPicker">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </p>
      <fieldset
        :disabled="
          busy ||
          confirming ||
          configurationFailed ||
          failedWrite ||
          listFailed ||
          candidateFailed ||
          !permitted
        "
      >
        <AbpExtensibleTable
          :data="candidates"
          :list="candidateList"
          record-key="id"
          :caption="kind === 'members' ? 'AbpIdentity::Members' : 'AbpIdentity::Roles'"
          searchable
        >
          <template #actions="{ row }">
            <AbpToggle
              :model-value="!!row.id && selectedIds.includes(row.id)"
              :aria-label="`${localization.t(kind === 'members' ? 'AbpIdentity::SelectMembers' : 'AbpIdentity::SelectRoles')}: ${nameOf(row)}`"
              :disabled="
                busy ||
                confirming ||
                configurationFailed ||
                failedWrite ||
                listFailed ||
                candidateFailed ||
                !permitted ||
                !row.id ||
                assignedIds.has(row.id)
              "
              @update:model-value="toggle(row.id, $event === true)"
            />
          </template>
        </AbpExtensibleTable>
      </fieldset>
      <p role="status">{{ localization.t('AbpUi::Selected') }}: {{ selectedIds.length }}</p>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
          localization.t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton
          :loading="busy"
          :disabled="
            !permitted ||
            configurationFailed ||
            failedWrite ||
            candidateFailed ||
            listFailed ||
            !selectedIds.length ||
            candidateList.requestStatus.value !== 'success' ||
            list.requestStatus.value !== 'success'
          "
          @click="save"
          >{{ localization.t('AbpUi::Save') }}</AbpButton
        >
      </template>
    </AbpModal>
  </section>
</template>

<script setup lang="ts">
import { AbpExtensibleTable, EXTENSIONS_IDENTIFIER } from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject as injectAbp,
  provideAbp,
  useListService,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  OrganizationUnitService,
  type IdentityRoleDto,
  type IdentityUserDto,
  type OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpModal,
  AbpToggle,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  OrganizationUnitComponentKeys,
  OrganizationUnitPolicies,
} from '../models/organization-units.js';
import {
  ORGANIZATION_MEMBERS,
  ORGANIZATION_ROLES,
} from '../tokens/organization-units-page.token.js';

type Assignment = IdentityUserDto | IdentityRoleDto;
const props = defineProps<{
  kind: 'members' | 'roles';
  selectedOrganizationUnit: OrganizationUnitWithDetailsDto;
}>();
const emit = defineEmits<{ added: []; deleted: [] }>();
const service = injectAbp(OrganizationUnitService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const permission = usePermission();
const confirmation = useConfirmation();
const toaster = useToaster();
const list = useListService();
const candidateList = useListService();
const pickerOpen = ref(false);
const selectedIds = ref<string[]>([]);
const busy = ref(false);
const listFailed = ref(false);
const candidateFailed = ref(false);
const failedWrite = ref(false);
const configurationFailed = ref(false);
const confirming = ref(false);
let revision = 0;
let controller = new AbortController();
const permitted = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(
      `${OrganizationUnitPolicies.Default} && ${props.kind === 'members' ? OrganizationUnitPolicies.ManageMembers : OrganizationUnitPolicies.ManageRoles}`,
    ),
);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    props.kind,
    props.selectedOrganizationUnit.id,
  ]),
);
const source = list.hookToQuery<Assignment>(async (query, signal) => {
  if (!permitted.value || !props.selectedOrganizationUnit.id) return { items: [], totalCount: 0 };
  const own = revision;
  const options = { signal: AbortSignal.any([signal, controller.signal]), skipHandleError: true };
  try {
    const result =
      props.kind === 'members'
        ? await service.getMembers(props.selectedOrganizationUnit.id, query, options)
        : await service.getRoles(props.selectedOrganizationUnit.id, query, options);
    if (own !== revision || options.signal.aborted) return { items: [], totalCount: 0 };
    listFailed.value = false;
    return result;
  } catch (error) {
    if (own === revision && !options.signal.aborted) listFailed.value = true;
    throw error;
  }
});
const items = source.items;
const assignedIds = computed(
  () => new Set(items.value.flatMap(item => (item.id ? [item.id] : []))),
);
const candidateSource = candidateList.hookToQuery<Assignment>(async (query, signal) => {
  if (!pickerOpen.value || !permitted.value || !props.selectedOrganizationUnit.id)
    return { items: [], totalCount: 0 };
  const own = revision;
  const options = { signal: AbortSignal.any([signal, controller.signal]), skipHandleError: true };
  try {
    const input = { ...query, id: props.selectedOrganizationUnit.id };
    const result =
      props.kind === 'members'
        ? await service.getAvailableUsers(input, options)
        : await service.getAvailableRoles(input, options);
    if (own !== revision || options.signal.aborted) return { items: [], totalCount: 0 };
    candidateFailed.value = false;
    return result;
  } catch (error) {
    if (own === revision && !options.signal.aborted) candidateFailed.value = true;
    throw error;
  }
});
const candidates = candidateSource.items;
provideAbp([
  {
    provide: EXTENSIONS_IDENTIFIER,
    useValue:
      props.kind === 'members'
        ? OrganizationUnitComponentKeys.Members
        : OrganizationUnitComponentKeys.Roles,
  },
  { provide: ORGANIZATION_MEMBERS, useValue: { remove } },
  { provide: ORGANIZATION_ROLES, useValue: { remove } },
]);

function nameOf(item: Assignment): string {
  return 'userName' in item ? (item.userName ?? '') : 'name' in item ? (item.name ?? '') : '';
}
function toggle(id: string | undefined, checked: boolean): void {
  if (
    !id ||
    busy.value ||
    failedWrite.value ||
    configurationFailed.value ||
    confirming.value ||
    candidateFailed.value ||
    listFailed.value ||
    candidateList.requestStatus.value !== 'success' ||
    list.requestStatus.value !== 'success' ||
    !permitted.value ||
    assignedIds.value.has(id) ||
    !candidates.value.some(item => item.id === id)
  )
    return;
  selectedIds.value = checked
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter(item => item !== id);
}
function openPicker(): void {
  if (!permitted.value || busy.value || failedWrite.value || configurationFailed.value) return;
  selectedIds.value = [];
  candidateFailed.value = false;
  pickerOpen.value = true;
  candidateList.get();
}
function closePicker(): void {
  if (!busy.value) {
    pickerOpen.value = false;
    selectedIds.value = [];
  }
}
async function confirmRefresh(): Promise<boolean> {
  if (confirming.value || busy.value) return false;
  if (!selectedIds.value.length && !failedWrite.value) return true;
  const own = revision;
  confirming.value = true;
  try {
    return (
      (await confirmation.warn(
        'AbpUi::AreYouSureYouWantToCancelEditingWarningMessage',
        'AbpUi::AreYouSure',
      )) === ConfirmationStatus.confirm &&
      own === revision &&
      permitted.value
    );
  } finally {
    if (own === revision) confirming.value = false;
  }
}
async function refreshAssignments(): Promise<void> {
  if (!(await confirmRefresh())) return;
  selectedIds.value = [];
  failedWrite.value = false;
  list.getWithoutPageReset();
  if (pickerOpen.value) candidateList.get();
}
async function refreshPicker(): Promise<void> {
  await refreshAssignments();
}
async function save(): Promise<void> {
  const id = props.selectedOrganizationUnit.id;
  if (
    !id ||
    !permitted.value ||
    busy.value ||
    confirming.value ||
    failedWrite.value ||
    configurationFailed.value ||
    candidateFailed.value ||
    listFailed.value ||
    !selectedIds.value.length ||
    candidateList.requestStatus.value !== 'success' ||
    list.requestStatus.value !== 'success'
  )
    return;
  const own = revision;
  const ids = [...new Set(selectedIds.value)];
  busy.value = true;
  try {
    const options = { signal: controller.signal, skipHandleError: true };
    if (props.kind === 'members') await service.addMembers(id, { userIds: ids }, options);
    else await service.addRoles(id, { roleIds: ids }, options);
    if (own !== revision || !permitted.value) return;
    pickerOpen.value = false;
    selectedIds.value = [];
    toaster.success('AbpUi::SavedSuccessfully');
    list.getWithoutPageReset();
    emit('added');
    await refreshPermissions(own);
  } catch {
    if (own === revision && !controller.signal.aborted) failedWrite.value = true;
  } finally {
    if (own === revision) busy.value = false;
  }
}
async function remove(item: Assignment): Promise<void> {
  const id = props.selectedOrganizationUnit.id;
  if (
    !id ||
    !item.id ||
    !permitted.value ||
    busy.value ||
    confirming.value ||
    failedWrite.value ||
    configurationFailed.value ||
    listFailed.value ||
    list.requestStatus.value !== 'success'
  )
    return;
  const own = revision;
  confirming.value = true;
  try {
    const answer = await confirmation.warn(
      props.kind === 'members'
        ? 'AbpIdentity::RemoveUserFromOuWarningMessage'
        : 'AbpIdentity::RemoveRoleFromOuWarningMessage',
      'AbpUi::AreYouSure',
      {
        messageLocalizationParams: [nameOf(item), props.selectedOrganizationUnit.displayName ?? ''],
      },
    );
    if (answer !== ConfirmationStatus.confirm || own !== revision || !permitted.value) return;
    busy.value = true;
    const options = { signal: controller.signal, skipHandleError: true };
    if (props.kind === 'members') await service.removeMember(id, item.id, options);
    else await service.removeRole(id, item.id, options);
    if (own !== revision || !permitted.value) return;
    toaster.success('AbpUi::DeletedSuccessfully');
    list.getWithoutPageReset();
    emit('deleted');
    await refreshPermissions(own);
  } catch {
    if (own === revision && !controller.signal.aborted) failedWrite.value = true;
  } finally {
    if (own === revision) {
      busy.value = false;
      confirming.value = false;
    }
  }
}
async function refreshPermissions(expectedRevision?: number): Promise<void> {
  const own = expectedRevision ?? revision;
  if (own !== revision || controller.signal.aborted) return;
  try {
    await config.refreshAppState();
    if (own === revision) configurationFailed.value = false;
  } catch {
    if (own === revision && !controller.signal.aborted) configurationFailed.value = true;
  }
}
function reset(): void {
  controller.abort();
  controller = new AbortController();
  revision += 1;
  items.value = [];
  candidates.value = [];
  pickerOpen.value = false;
  selectedIds.value = [];
  busy.value = false;
  confirming.value = false;
  failedWrite.value = false;
  configurationFailed.value = false;
  listFailed.value = false;
  candidateFailed.value = false;
  list.get();
}
watch(
  () => props.selectedOrganizationUnit,
  (unit, previous) => {
    if (unit.id !== previous.id) return;
    list.getWithoutPageReset();
    if (pickerOpen.value) candidateList.getWithoutPageReset();
  },
);
watch([context, permitted], reset, { flush: 'sync' });
onBeforeUnmount(() => {
  revision += 1;
  controller.abort();
});
</script>
