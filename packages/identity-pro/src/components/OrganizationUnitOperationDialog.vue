<template>
  <AbpModal
    :visible="true"
    :busy="busy"
    :dirty="false"
    suppress-unsaved-changes-warning
    @update:visible="$event || emit('close')"
  >
    <template #header>{{ title }}</template>
    <AbpSpinner v-if="loading" />
    <div v-else-if="loadFailed" role="alert">
      <p>
        {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      </p>
      <AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <form v-else-if="details" novalidate @submit.prevent="save">
      <p v-if="mode === 'delete'">
        {{
          localization.t(
            'AbpIdentity::OrganizationUnitDeletionConfirmationMessage',
            details.displayName ?? '',
          )
        }}
      </p>
      <p v-else-if="mode === 'move-users'">{{ moveMessage }}</p>
      <p v-else>{{ details.displayName }}</p>
      <p v-if="mode === 'delete'">
        {{
          localization.t(
            'AbpIdentity::ChooseAnActionForOrganizationUnit',
            String(details.userCount ?? 0),
          )
        }}
      </p>
      <section
        v-if="mode !== 'move'"
        :aria-label="localization.t('AbpIdentity::OrganizationUnits')"
      >
        <p>{{ localization.t('AbpIdentity::OrganizationUnits{0}', affectedUnits.length) }}</p>
        <ul>
          <li v-for="affected in affectedUnits" :key="affected.id">
            {{ organizationUnitPath(all, affected.id ?? '') }}
            ({{ localization.t('AbpIdentity::UserCount') }}: {{ affected.userCount ?? 0 }};
            {{ localization.t('AbpIdentity::Roles') }}: {{ affected.roles?.length ?? 0 }})
          </li>
        </ul>
      </section>

      <p v-if="moveCompleted" role="status">
        {{ localization.t('AbpIdentity::MoveAllUsers') }}:
        {{ localization.t('AbpUi::SavedSuccessfully') }}
      </p>
      <template v-else>
        <AbpToggle
          v-if="mode === 'delete' && options.length"
          v-model="assign"
          name="assignOrganizationUsers"
          :label="localization.t('AbpIdentity::AssignUsersToOtherOrganizationUnit')"
          :disabled="busy || saveFailed || confirming"
        />
        <p v-if="mode === 'delete' && !assign">
          {{ localization.t('AbpIdentity::UnassignOrganizationUnit') }}
        </p>
        <AbpFormField
          v-if="mode !== 'delete' || assign"
          :label="localization.t('AbpIdentity::OrganizationUnit')"
          :required="mode === 'delete'"
          :errors="selectionErrors"
        >
          <template #default="{ id, describedBy, invalid }">
            <AbpSelect
              :id="id"
              v-model="targetId"
              name="targetOrganizationUnit"
              :options="targetOptions"
              :disabled="busy || saveFailed || confirming"
              :invalid="invalid"
              :aria-describedby="describedBy"
            />
          </template>
        </AbpFormField>
      </template>
      <div v-if="saveFailed" role="alert">
        <p>
          {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
        </p>
        <AbpButton variant="secondary" :disabled="busy || confirming" @click="refresh">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </div>
    </form>
    <p v-if="configurationFailed" role="alert">
      {{ localization.t('AbpUi::SavedSuccessfully') }}.
      {{ localization.t('AbpIdentity::Permissions') }}:
      {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" :disabled="busy" @click="refreshPermissions()">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy || confirming" @click="close">{{
        localization.t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton
        :variant="mode === 'delete' ? 'danger' : 'primary'"
        :loading="busy"
        :disabled="!canSave || confirming"
        @click="save"
        >{{ localization.t(mode === 'delete' ? 'AbpUi::Delete' : 'AbpUi::Save') }}</AbpButton
      >
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import {
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  OrganizationUnitService,
  type OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { OrganizationUnitPolicies } from '../models/organization-units.js';
import {
  organizationUnitDescendantIds,
  organizationUnitTargets,
  organizationUnitPath,
} from '../utils/organization-units.js';

const props = defineProps<{
  mode: 'move' | 'move-users' | 'delete';
  unit: OrganizationUnitWithDetailsDto;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const service = injectAbp(OrganizationUnitService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const confirmation = useConfirmation();
const details = shallowRef<OrganizationUnitWithDetailsDto>();
const all = shallowRef<OrganizationUnitWithDetailsDto[]>([]);
const noTarget = '__identity_no_organization_unit__';
const targetId = ref(noTarget);
const assign = ref(false);
const loading = ref(false);
const busy = ref(false);
const loadFailed = ref(false);
const saveFailed = ref(false);
const moveCompleted = ref(false);
const completed = ref(false);
const configurationFailed = ref(false);
const confirming = ref(false);
const selectionInvalid = ref(false);
const permitted = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(
      `${OrganizationUnitPolicies.Default} && ${OrganizationUnitPolicies.ManageOU}`,
    ),
);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const options = computed(() => organizationUnitTargets(all.value, props.unit.id ?? ''));
const affectedUnits = computed(() => {
  const source = details.value;
  if (!source) return [];
  if (props.mode === 'move-users' && targetId.value === noTarget) return [source];
  const ids = organizationUnitDescendantIds(all.value, source.id ?? '');
  return [source, ...all.value.filter(unit => unit.id !== source.id && ids.has(unit.id ?? ''))];
});
const title = computed(() =>
  props.mode === 'delete'
    ? localization.t('AbpUi::AreYouSure')
    : props.mode === 'move-users'
      ? localization.t('AbpIdentity::MoveAllUsers')
      : localization.t(
          'AbpIdentity::MoveOrganizationUnit',
          details.value?.displayName ?? props.unit.displayName ?? '',
        ),
);
const moveMessage = computed(() =>
  localization
    .t('AbpIdentity::MoveAllUsersWithOrganizationUnitTo')
    .replace(/<\/?b>/gi, '')
    .replaceAll('{0}', () => details.value?.displayName ?? ''),
);
const targetOptions = computed(() => [
  {
    value: noTarget,
    label:
      props.mode === 'move'
        ? localization.t('AbpIdentity::OrganizationUnit:Root')
        : localization.t(
            props.mode === 'delete'
              ? 'AbpIdentity::SelectAnOrganizationUnitToAssign'
              : 'AbpIdentity::UnassignOrganizationUnit',
          ),
  },
  ...options.value.flatMap(unit =>
    unit.id ? [{ value: unit.id, label: organizationUnitPath(all.value, unit.id) }] : [],
  ),
]);
const selectionErrors = computed(() =>
  selectionInvalid.value ? [localization.t('AbpValidation::ThisFieldIsRequired.')] : [],
);
const canSave = computed(
  () =>
    permitted.value &&
    !!details.value &&
    !loading.value &&
    !loadFailed.value &&
    !saveFailed.value &&
    !configurationFailed.value &&
    !completed.value,
);
let revision = 0;
let controller: AbortController | undefined;
async function load(): Promise<void> {
  controller?.abort();
  const own = ++revision;
  controller = new AbortController();
  const current = controller;
  loading.value = true;
  loadFailed.value = false;
  details.value = undefined;
  try {
    if (!props.unit.id || !permitted.value) return;
    const settings = { signal: current.signal, skipHandleError: true };
    const [fresh, list] = await Promise.all([
      service.get(props.unit.id, settings),
      service.getListAll(settings),
    ]);
    if (own !== revision || current.signal.aborted) return;
    if (fresh.id !== props.unit.id || !Array.isArray(list.items)) {
      loadFailed.value = true;
      return;
    }
    details.value = fresh;
    all.value = list.items;
    saveFailed.value = false;
  } catch {
    if (own === revision && !current.signal.aborted) loadFailed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}
async function refresh(): Promise<void> {
  if (busy.value || confirming.value) return;
  const own = revision;
  confirming.value = true;
  try {
    const answer = await confirmation.warn('AbpUi::Refresh', 'AbpUi::AreYouSure');
    if (answer === ConfirmationStatus.confirm && own === revision && permitted.value) await load();
  } finally {
    confirming.value = false;
  }
}
async function save(): Promise<void> {
  const unit = details.value;
  if (!unit?.id || !canSave.value || busy.value || confirming.value) return;
  const target = targetId.value === noTarget ? null : targetId.value;
  if (
    !moveCompleted.value &&
    ((props.mode === 'delete' && assign.value && !target) ||
      (target && !options.value.some(option => option.id === target)))
  ) {
    selectionInvalid.value = true;
    return;
  }
  const own = revision;
  busy.value = true;
  try {
    const settings = { signal: controller?.signal, skipHandleError: true };
    if (props.mode === 'move') await service.move(unit.id, { newParentId: target }, settings);
    else {
      if (!moveCompleted.value && (props.mode === 'move-users' || assign.value)) {
        await service.moveAllUsers(unit.id, target, settings);
        if (own !== revision || !permitted.value) return;
        if (props.mode === 'delete') {
          moveCompleted.value = true;
          emit('saved');
          if (!(await refreshPermissions(own)) || own !== revision || !permitted.value) return;
        }
      }
      if (props.mode === 'delete') await service.delete(unit.id, settings);
    }
    if (own !== revision || !permitted.value) return;
    toaster.success(
      props.mode === 'delete' ? 'AbpUi::DeletedSuccessfully' : 'AbpUi::SavedSuccessfully',
    );
    completed.value = true;
    emit('saved');
    if (await refreshPermissions(own)) emit('close');
  } catch {
    if (own === revision && !controller?.signal.aborted) saveFailed.value = true;
  } finally {
    if (own === revision) busy.value = false;
  }
}
async function refreshPermissions(expectedRevision?: number): Promise<boolean> {
  const own = expectedRevision ?? revision;
  if (own !== revision || controller?.signal.aborted) return false;
  try {
    await config.refreshAppState();
    if (own !== revision || controller?.signal.aborted) return false;
    configurationFailed.value = false;
    if (completed.value && expectedRevision === undefined) emit('close');
    return true;
  } catch {
    if (own === revision && !controller?.signal.aborted) configurationFailed.value = true;
    return false;
  }
}
watch(
  () => [props.unit.id, props.mode],
  () => {
    targetId.value = noTarget;
    assign.value = false;
    moveCompleted.value = false;
    completed.value = false;
    configurationFailed.value = false;
    selectionInvalid.value = false;
    void load();
  },
  { immediate: true },
);
watch(targetId, () => {
  selectionInvalid.value = false;
});
watch(
  [context, permitted],
  () => {
    revision += 1;
    controller?.abort();
    emit('close');
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => {
  revision += 1;
  controller?.abort();
});
</script>
