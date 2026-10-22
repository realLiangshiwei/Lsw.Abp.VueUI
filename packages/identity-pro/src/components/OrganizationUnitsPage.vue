<template>
  <AbpPage title="AbpIdentity::OrganizationUnits">
    <template #toolbar><AbpPageToolbar :data="units" /></template>
    <p v-if="listFailed" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" :disabled="treeLoading" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <div
      v-if="mayRead"
      class="abp-organization-layout"
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
        gap: 1rem;
      "
    >
      <section style="min-width: 0" :aria-label="localization.t('AbpIdentity::OrganizationTree')">
        <div
          class="abp-organization-heading"
          style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center"
        >
          <h2>{{ localization.t('AbpIdentity::OrganizationTree') }}</h2>
          <AbpButton v-if="mayManage" :disabled="treeLoading" @click="show()">{{
            localization.t('AbpIdentity::AddRootUnit')
          }}</AbpButton>
          <AbpButton variant="secondary" :disabled="treeLoading" @click="load">{{
            localization.t('AbpUi::Refresh')
          }}</AbpButton>
        </div>
        <AbpSpinner v-if="treeLoading" />
        <OrganizationUnitTree
          :items="units"
          :selected-id="selectedId"
          :manageable="mayManage"
          :busy="treeLoading"
          @select="select"
          @edit="show($event)"
          @add="show(undefined, $event)"
          @move="operate('move', $event)"
          @move-users="operate('move-users', $event)"
          @remove="operate('delete', $event)"
        />
        <p v-if="!treeLoading && !units.length && !listFailed">
          {{ localization.t('AbpIdentity::NoOrganizationUnits') }}
        </p>
      </section>
      <section
        v-if="tabs.length"
        style="min-width: 0"
        :aria-label="localization.t('AbpIdentity::OrganizationUnit')"
      >
        <AbpTabList
          v-model="tab"
          :items="tabs"
          :aria-label="localization.t('AbpIdentity::OrganizationUnit')"
        >
          <template #label="{ item }"
            >{{ localization.t(item.text)
            }}<span v-if="selected">
              ({{
                item.name === 'members' ? selected.userCount : (selected.roles?.length ?? 0)
              }})</span
            ></template
          >
        </AbpTabList>
        <div role="tabpanel">
          <template v-if="selected">
            <p>{{ selected.code ?? '' }}</p>
            <p>
              {{
                localization.t(
                  'AbpIdentity::OrganizationUnit:Parent{0}',
                  units.find(unit => unit.id === selected?.parentId)?.displayName ??
                    localization.t('AbpIdentity::OrganizationUnit:Root'),
                )
              }}
            </p>
            <AbpReplaceable
              v-if="tab === 'members' && mayMembers"
              :replaceable-key="OrganizationUnitComponentKeys.Members"
              :selected-organization-unit="selected"
              @added="load"
              @deleted="load"
            >
              <OrganizationMembers
                :selected-organization-unit="selected"
                @added="load"
                @deleted="load"
              />
            </AbpReplaceable>
            <AbpReplaceable
              v-else-if="tab === 'roles' && mayRoles"
              :replaceable-key="OrganizationUnitComponentKeys.Roles"
              :selected-organization-unit="selected"
              @added="load"
              @deleted="load"
            >
              <OrganizationRoles
                :selected-organization-unit="selected"
                @added="load"
                @deleted="load"
              />
            </AbpReplaceable>
          </template>
          <p v-else>
            {{
              localization.t(
                tab === 'roles'
                  ? 'AbpIdentity::SelectAnOrganizationUnitToSeeRoles'
                  : 'AbpIdentity::SelectAnOrganizationUnitToSeeMembers',
              )
            }}
          </p>
        </div>
      </section>
    </div>
    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::OrganizationUnits"
      create-title="AbpIdentity::NewOrganizationUnit"
      edit-title="AbpIdentity::EditOrganizationUnit"
      :save="save"
    >
      <AbpSpinner v-if="editorLoading" />
      <div v-else-if="editorLoadFailed" role="alert">
        <p>
          {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
        </p>
        <AbpButton variant="secondary" @click="show(pendingUnit, pendingParent)">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </div>
      <form v-else-if="editor.form.value" ref="editorForm" novalidate @submit.prevent="save">
        <p v-if="pendingParent">
          {{
            localization.t(
              'AbpIdentity::OrganizationUnit:Parent{0}',
              pendingParent.displayName ?? '',
            )
          }}
        </p>
        <fieldset :disabled="editor.busy.value || !canSave">
          <AbpExtensibleForm :form="editor.form.value" :record="editor.editing.value" />
        </fieldset>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="editor.busy.value" @click="close">{{
          localization.t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton
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
    <OrganizationUnitOperationDialog
      v-if="operation"
      :mode="operation.mode"
      :unit="operation.unit"
      @saved="load"
      @close="operation = undefined"
    />
  </AbpPage>
</template>
<script setup lang="ts">
import {
  AbpExtensibleForm,
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
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  OrganizationUnitService,
  type OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { AbpButton, AbpSpinner, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import {
  OrganizationUnitComponentKeys,
  OrganizationUnitPolicies,
} from '../models/organization-units.js';
import { ORGANIZATION_UNITS_PAGE } from '../tokens/organization-units-page.token.js';
import { OrganizationUnitsStateService } from '../services/organization-units-state.service.js';
import {
  getOrganizationUnitFormChanges,
  OrganizationUnitStateError,
  serializeOrganizationUnitCreate,
  serializeOrganizationUnitUpdate,
} from '../utils/organization-units.js';
import OrganizationMembers from './OrganizationMembers.vue';
import OrganizationRoles from './OrganizationRoles.vue';
import OrganizationUnitOperationDialog from './OrganizationUnitOperationDialog.vue';
import OrganizationUnitTree from './OrganizationUnitTree.vue';

const service = injectAbp(OrganizationUnitService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const permission = usePermission();
const toaster = useToaster();
const units = shallowRef<OrganizationUnitWithDetailsDto[]>([]);
const selection = injectAbp(OrganizationUnitsStateService);
const selected = selection.getSelectedNode();
const selectedId = computed(() => selected.value?.id);
const tab = ref('members');
const treeLoading = ref(false);
const listFailed = ref(false);
const editorLoading = ref(false);
const editorLoadFailed = ref(false);
const writeFailed = ref(false);
const pendingUnit = shallowRef<OrganizationUnitWithDetailsDto>();
const pendingParent = shallowRef<OrganizationUnitWithDetailsDto>();
const operation = shallowRef<{
  mode: 'move' | 'move-users' | 'delete';
  unit: OrganizationUnitWithDetailsDto;
}>();
const mayRead = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(OrganizationUnitPolicies.Default),
);
const mayManage = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(
      `${OrganizationUnitPolicies.Default} && ${OrganizationUnitPolicies.ManageOU}`,
    ),
);
const mayMembers = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(
      `${OrganizationUnitPolicies.Default} && ${OrganizationUnitPolicies.ManageMembers}`,
    ),
);
const mayRoles = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(
      `${OrganizationUnitPolicies.Default} && ${OrganizationUnitPolicies.ManageRoles}`,
    ),
);
const tabs = computed(() => [
  ...(mayMembers.value ? [{ name: 'members', text: 'AbpIdentity::Members' }] : []),
  ...(mayRoles.value ? [{ name: 'roles', text: 'AbpIdentity::Roles' }] : []),
]);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
let treeRevision = 0;
let treeController: AbortController | undefined;
let editorRevision = 0;
let editorController: AbortController | undefined;
const editorForm = useTemplateRef<HTMLFormElement>('editorForm');
const editor: RecordEditor<OrganizationUnitWithDetailsDto> = useRecordEditor({
  identifier: OrganizationUnitComponentKeys.Units,
  reload: () => {
    void load();
  },
  create: createUnit,
  update: updateUnit,
  delete: id => service.delete(id),
  idOf: unit => unit.id,
  stampOf: unit => unit.concurrencyStamp,
  nameOf: unit => unit.displayName ?? '',
  deletionMessage: 'AbpIdentity::OrganizationUnitDeletionConfirmationMessage',
  providers: [
    {
      provide: ORGANIZATION_UNITS_PAGE,
      useValue: {
        add: (parent?: OrganizationUnitWithDetailsDto) => {
          void show(undefined, parent);
        },
        edit: (unit: OrganizationUnitWithDetailsDto) => show(unit),
        move: (unit: OrganizationUnitWithDetailsDto) => operate('move', unit),
        remove: (unit: OrganizationUnitWithDetailsDto) => operate('delete', unit),
        moveAllUsers: (unit: OrganizationUnitWithDetailsDto) => operate('move-users', unit),
      },
    },
  ],
});
const canSave = computed(
  () =>
    mayManage.value &&
    editor.open.value &&
    !editorLoading.value &&
    !editorLoadFailed.value &&
    !writeFailed.value &&
    !!editor.form.value,
);
async function load(): Promise<void> {
  treeController?.abort();
  const own = ++treeRevision;
  treeController = new AbortController();
  const current = treeController;
  treeLoading.value = true;
  try {
    if (!mayRead.value) {
      units.value = [];
      return;
    }
    const result = await service.getListAll({ signal: current.signal, skipHandleError: true });
    if (own !== treeRevision || current.signal.aborted) return;
    units.value = result.items;
    selection.setSelectedUnit(units.value.find(unit => unit.id === selectedId.value));
    listFailed.value = false;
  } catch {
    if (own === treeRevision && !current.signal.aborted) listFailed.value = true;
  } finally {
    if (own === treeRevision) treeLoading.value = false;
  }
}
function select(unit: OrganizationUnitWithDetailsDto): void {
  if (mayRead.value) selection.setSelectedUnit(unit);
}
function operate(
  mode: 'move' | 'move-users' | 'delete',
  unit: OrganizationUnitWithDetailsDto,
): void {
  if (mayManage.value && unit.id) operation.value = { mode, unit };
}
function resetEditor(): void {
  editorController?.abort();
  editorRevision += 1;
  editorLoading.value = false;
  editorLoadFailed.value = false;
  writeFailed.value = false;
  editor.form.value = undefined;
  editor.busy.value = false;
}
async function show(
  unit?: OrganizationUnitWithDetailsDto,
  parent?: OrganizationUnitWithDetailsDto,
): Promise<void> {
  if (!mayManage.value || editor.busy.value) return;
  resetEditor();
  pendingUnit.value = unit;
  pendingParent.value = parent;
  editor.editing.value = unit;
  editor.open.value = true;
  editorController = new AbortController();
  const current = editorController;
  const own = editorRevision;
  if (!unit && !parent) {
    editor.show();
    return;
  }
  editorLoading.value = true;
  try {
    const id = unit?.id ?? parent?.id;
    if (!id) {
      editorLoadFailed.value = true;
      return;
    }
    const fresh = await service.get(id, { signal: current.signal, skipHandleError: true });
    if (own !== editorRevision || current.signal.aborted || !editor.open.value) return;
    if (fresh.id !== id) {
      editorLoadFailed.value = true;
      return;
    }
    if (unit) editor.show({ ...fresh, extraProperties: { ...fresh.extraProperties } });
    else {
      pendingParent.value = fresh;
      editor.show();
    }
  } catch {
    if (own === editorRevision && !current.signal.aborted) editorLoadFailed.value = true;
  } finally {
    if (own === editorRevision) editorLoading.value = false;
  }
}
function createUnit(): Promise<OrganizationUnitWithDetailsDto> {
  const form = editor.form.value;
  if (!canSave.value || !form || editor.editing.value)
    throw new OrganizationUnitStateError(
      'The create form is unavailable. Reopen the organization unit editor.',
    );
  return service.create(
    serializeOrganizationUnitCreate(
      getOrganizationUnitFormChanges(form, undefined, editor.injector),
      pendingParent.value?.id ?? null,
    ),
    { signal: editorController?.signal, skipHandleError: true },
  );
}
function updateUnit(id: string): Promise<OrganizationUnitWithDetailsDto> {
  const form = editor.form.value;
  const record = editor.editing.value;
  if (!canSave.value || !form || !record || record.id !== id)
    throw new OrganizationUnitStateError(
      'The edit target changed. Reopen the organization unit editor.',
    );
  return service.update(
    id,
    serializeOrganizationUnitUpdate(
      record,
      getOrganizationUnitFormChanges(form, record, editor.injector),
    ),
    { signal: editorController?.signal, skipHandleError: true },
  );
}
async function save(): Promise<void> {
  const form = editor.form.value;
  if (!canSave.value || !form || editor.busy.value) return;
  if (!form.form.validate()) {
    await nextTick();
    editorForm.value?.querySelector<HTMLElement>('[aria-invalid="true"]:not([disabled])')?.focus();
    return;
  }
  const own = editorRevision;
  editor.busy.value = true;
  try {
    const record = editor.editing.value;
    if (record?.id) await updateUnit(record.id);
    else await createUnit();
    if (own !== editorRevision || !mayManage.value) return;
    editor.open.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    void load();
  } catch (error) {
    if (own !== editorRevision || editorController?.signal.aborted) return;
    writeFailed.value = true;
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
    if (own === editorRevision) editor.busy.value = false;
  }
}
async function reloadEditor(close: () => Promise<void>): Promise<void> {
  if (editor.busy.value) return;
  const unit = pendingUnit.value;
  const parent = pendingParent.value;
  const ownContext = context.value;
  await close();
  if (editor.open.value || context.value !== ownContext) return;
  await nextTick();
  await show(unit, parent);
}
watch(
  () => editor.open.value,
  open => {
    if (!open) resetEditor();
  },
);
watch(
  tabs,
  value => {
    if (!value.some(item => item.name === tab.value)) tab.value = value[0]?.name ?? '';
  },
  { immediate: true },
);
watch(
  [context, mayRead, mayManage],
  () => {
    editor.invalidate?.();
    units.value = [];
    selection.removeSelectedNode();
    operation.value = undefined;
    editor.open.value = false;
    resetEditor();
    void load();
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => {
  treeRevision += 1;
  treeController?.abort();
  resetEditor();
  selection.removeSelectedNode();
});
void load();
</script>
