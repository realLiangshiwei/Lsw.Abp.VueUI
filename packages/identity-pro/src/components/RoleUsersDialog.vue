<template>
  <AbpModal
    :visible="true"
    :busy="busy"
    :dirty="false"
    suppress-unsaved-changes-warning
    @update:visible="$event || emit('close')"
  >
    <template #header>
      {{ localization.t(mode === 'delete' ? 'AbpUi::AreYouSure' : 'AbpIdentity::MoveAllUsers') }}
    </template>
    <AbpSpinner v-if="loading" />
    <div v-else-if="loadFailed" role="alert">
      <p>{{ localization.t('AbpUi::ErrorLoadingDatatable') }}</p>
      <AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <form v-else-if="details" novalidate @submit.prevent="save">
      <p v-if="mode === 'delete'">
        {{ localization.t('AbpIdentity::RoleDeletionConfirmationMessage', details.name ?? '') }}
      </p>
      <p v-else>
        {{ moveMessage }}
      </p>
      <p>{{ localization.t('AbpIdentity::UserCount') }}: {{ details.userCount }}</p>
      <p v-if="details.isStatic && mode === 'delete'" role="alert">
        {{ localization.t('AbpExceptionHandling::403MessageDetail') }}
      </p>
      <p v-else-if="mode === 'move' && details.userCount === 0" role="status">
        {{ localization.t('AbpIdentity::ThereIsNoUsersCurrentlyInThisRole') }}
      </p>
      <template v-else-if="!moveCompleted && (mode === 'move' || details.userCount > 0)">
        <p v-if="mode === 'delete'">
          {{ localization.t('AbpIdentity::ChooseAnActionForRole', String(details.userCount)) }}
        </p>
        <AbpToggle
          v-if="mode === 'delete' && options.length && mayUpdate"
          v-model="assign"
          name="assignUsers"
          :label="localization.t('AbpIdentity::AssignUsersToOtherRole')"
          :disabled="busy"
        />
        <p v-if="mode === 'delete' && !assign">
          {{ localization.t('AbpIdentity::UnassignTheRoleFromTheUsers') }}
        </p>
        <AbpFormField
          v-if="mode === 'move' || assign"
          :label="localization.t('AbpIdentity::Roles')"
          :required="mode === 'delete'"
          :errors="selectionErrors"
        >
          <template #default="{ id, describedBy, invalid }">
            <AbpSelect
              :id="id"
              v-model="targetId"
              name="targetRole"
              :options="targetOptions"
              :disabled="busy"
              :invalid="invalid"
              :aria-describedby="describedBy"
            />
          </template>
        </AbpFormField>
      </template>
      <p v-if="moveCompleted" role="status">
        {{ localization.t('AbpIdentity::MoveAllUsers') }}:
        {{ localization.t('AbpUi::SavedSuccessfully') }}
      </p>
      <p v-if="saveFailed || refreshFailed" role="alert">
        <template v-if="operationCompleted">
          {{
            localization.t(
              mode === 'delete' ? 'AbpUi::DeletedSuccessfully' : 'AbpUi::SavedSuccessfully',
            )
          }}. {{ localization.t('AbpIdentity::Permissions') }}:
        </template>
        {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
        <AbpButton variant="secondary" :disabled="busy" @click="load">
          {{ localization.t('AbpUi::Refresh') }}
        </AbpButton>
      </p>
    </form>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton
        :variant="mode === 'delete' ? 'danger' : 'primary'"
        :loading="busy"
        :disabled="!canSave"
        @click="save"
      >
        {{ localization.t(mode === 'delete' ? 'AbpUi::Delete' : 'AbpUi::Save') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import {
  ConfigStateService,
  AbpHttpError,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import { IdentityRoleService, type IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

const props = defineProps<{ mode: 'delete' | 'move'; role: IdentityRoleDto }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const roles = injectAbp(IdentityRoleService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const details = shallowRef<IdentityRoleDto>();
const options = shallowRef<IdentityRoleDto[]>([]);
const noTarget = '__identity_no_role__';
const targetId = ref(noTarget);
const assign = ref(false);
const loading = ref(false);
const busy = ref(false);
const loadFailed = ref(false);
const saveFailed = ref(false);
const moveCompleted = ref(false);
const operationCompleted = ref(false);
const refreshFailed = ref(false);
const selectionInvalid = ref(false);
const mayUpdate = computed(() => permission.isGranted(IdentityProPolicyNames.RolesUpdate));
const permitted = computed(() =>
  permission.isGranted(
    `${IdentityProPolicyNames.Roles} && ${
      props.mode === 'delete'
        ? IdentityProPolicyNames.RolesDelete
        : IdentityProPolicyNames.RolesUpdate
    }`,
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
const targetOptions = computed(() => [
  {
    value: noTarget,
    label: localization.t(
      props.mode === 'move' ? 'AbpIdentity::UnassignRole' : 'AbpIdentity::SelectAnRoleToAssign',
    ),
  },
  ...options.value.flatMap(role => (role.id ? [{ value: role.id, label: role.name ?? '' }] : [])),
]);
const moveMessage = computed(() =>
  localization
    .t('AbpIdentity::MoveAllUsersWithRoleTo')
    .replace(/<\/?b>/gi, '')
    .replaceAll('{0}', () => details.value?.name ?? ''),
);
const selectionErrors = computed(() =>
  selectionInvalid.value ? [localization.t('AbpValidation::ThisFieldIsRequired.')] : [],
);
const canSave = computed(
  () =>
    permitted.value &&
    !loading.value &&
    !loadFailed.value &&
    !saveFailed.value &&
    !refreshFailed.value &&
    !operationCompleted.value &&
    !!details.value &&
    !(props.mode === 'delete' && details.value.isStatic) &&
    !(props.mode === 'move' && details.value.userCount === 0) &&
    (!assign.value || mayUpdate.value),
);
let revision = 0;
let pending: AbortController | undefined;

async function load(): Promise<void> {
  if (operationCompleted.value) {
    await refreshAuthorization();
    return;
  }
  pending?.abort();
  const own = ++revision;
  const request = new AbortController();
  pending = request;
  loading.value = true;
  busy.value = false;
  loadFailed.value = false;
  const recovering = saveFailed.value;
  saveFailed.value = false;
  refreshFailed.value = false;
  details.value = undefined;
  targetId.value = noTarget;
  assign.value = false;
  selectionInvalid.value = false;
  try {
    if (recovering) await config.refreshAppState();
    if (own !== revision || request.signal.aborted || !props.role.id || !permitted.value) return;
    const settings = { signal: request.signal, skipHandleError: true };
    const fresh = await roles.get(props.role.id, settings).catch((error: unknown) => {
      if (
        recovering &&
        props.mode === 'delete' &&
        error instanceof AbpHttpError &&
        error.status === 404
      )
        return null;
      throw error;
    });
    if (own !== revision || request.signal.aborted) return;
    if (fresh === null) {
      operationCompleted.value = true;
      emit('saved');
      await refreshAuthorization(own);
      return;
    }
    const all = await roles.getAllList(settings);
    if (own !== revision || request.signal.aborted) return;
    if (fresh.id !== props.role.id || !Array.isArray(all.items)) {
      loadFailed.value = true;
      return;
    }
    details.value = fresh;
    options.value = all.items.filter(role => role.id !== fresh.id);
  } catch {
    if (own === revision && !request.signal.aborted) loadFailed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}

async function refreshAuthorization(own = revision): Promise<void> {
  refreshFailed.value = false;
  loading.value = true;
  try {
    await config.refreshAppState();
    if (own === revision) emit('close');
  } catch {
    if (own === revision) refreshFailed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}

async function save(): Promise<void> {
  const role = details.value;
  if (!role?.id || !canSave.value || busy.value) return;
  const target = targetId.value === noTarget ? null : targetId.value;
  if (
    !moveCompleted.value &&
    (assign.value || target !== null) &&
    !options.value.some(role => role.id === target)
  ) {
    selectionInvalid.value = true;
    return;
  }
  const own = revision;
  busy.value = true;
  saveFailed.value = false;
  try {
    const settings = { signal: pending?.signal, skipHandleError: true };
    if (!moveCompleted.value && (props.mode === 'move' || assign.value)) {
      await roles.moveAllUsers(role.id, target, settings);
      if (own !== revision || !permitted.value) return;
      if (props.mode === 'delete') {
        moveCompleted.value = true;
        emit('saved');
        await config.refreshAppState();
        if (own !== revision || !permitted.value) return;
      }
    }
    if (props.mode === 'delete') await roles.delete(role.id, settings);
    if (own !== revision || !permitted.value) return;
    operationCompleted.value = true;
    toaster.success(
      props.mode === 'delete' ? 'AbpUi::DeletedSuccessfully' : 'AbpUi::SavedSuccessfully',
    );
    emit('saved');
    await refreshAuthorization();
  } catch {
    if (own === revision && !pending?.signal.aborted) saveFailed.value = true;
  } finally {
    if (own === revision) busy.value = false;
  }
}

watch(
  () => [props.role.id, props.mode],
  () => {
    moveCompleted.value = false;
    operationCompleted.value = false;
    refreshFailed.value = false;
    void load();
  },
  { immediate: true },
);
watch(
  [context, permitted, mayUpdate],
  () => {
    pending?.abort();
    revision += 1;
    emit('close');
  },
  { flush: 'sync' },
);
watch(targetId, () => {
  selectionInvalid.value = false;
});
onBeforeUnmount(() => {
  revision += 1;
  pending?.abort();
});
</script>
