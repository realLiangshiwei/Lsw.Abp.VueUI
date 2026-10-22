<template>
  <AbpModal
    :visible="true"
    :busy="saving"
    :dirty="dirty || Boolean(newType || newValue)"
    @update:visible="$event || close()"
  >
    <template #header>
      {{ localization.t('AbpIdentity::Claims') }} - {{ displayName ?? entityId }}
    </template>

    <AbpSpinner v-if="loadingTypes || loadingClaims" />
    <div v-if="typesFailed" role="alert">
      <p>{{ failureText }}</p>
      <AbpButton variant="secondary" :disabled="loadingTypes || saving" @click="loadTypes">
        {{ localization.t('AbpUi::Refresh') }}: {{ localization.t('AbpIdentity::Type') }}
      </AbpButton>
    </div>
    <div v-if="claimsFailed" role="alert">
      <p>{{ failureText }}</p>
      <AbpButton variant="secondary" :disabled="loadingClaims || saving" @click="loadClaims">
        {{ localization.t('AbpUi::Refresh') }}: {{ localization.t('AbpIdentity::Claims') }}
      </AbpButton>
    </div>

    <form v-if="claimTypes?.length" novalidate @submit.prevent="add">
      <AbpFormField
        v-slot="field"
        :label="localization.t('AbpIdentity::Type')"
        :errors="submitted && !newType ? [requiredText] : []"
        required
      >
        <AbpSelect
          :id="field.id"
          :model-value="newType"
          name="claimType"
          :options="typeOptions"
          :disabled="editingBlocked || !claims"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          @update:model-value="changeType"
        />
      </AbpFormField>
      <AbpFormField
        v-slot="field"
        :label="localization.t('AbpIdentity::ClaimValue')"
        :errors="newErrors"
        required
      >
        <ClaimValueInput
          :id="field.id"
          :model-value="newValue"
          name="claimValue"
          :value-type="getIdentityClaimValueType(selectedType)"
          :disabled="editingBlocked || !claims"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          @update:model-value="changeValue"
        />
      </AbpFormField>
      <p v-if="duplicate" role="alert">{{ localization.t('AbpIdentity::ClaimAlreadyExist') }}</p>
      <AbpButton type="submit" :disabled="editingBlocked || !claims">
        {{ localization.t('AbpIdentity::AddClaim') }}
      </AbpButton>
    </form>
    <p v-else-if="claimTypes" role="status">
      {{ localization.t('AbpIdentity::NoClaimTypesDefinedInfo') }}
    </p>

    <div v-for="(claim, index) in claims" :key="index" style="margin-block-start: 1rem">
      <AbpFormField v-slot="field" :label="claim.claimType ?? ''" :errors="rowErrors(claim)">
        <ClaimValueInput
          :id="field.id"
          :model-value="claim.claimValue"
          :name="`existingClaim-${index}`"
          :value-type="
            getIdentityClaimValueType(claimTypes?.find(type => type.name === claim.claimType))
          "
          :disabled="editingBlocked"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          @update:model-value="updateClaim(index, $event)"
        />
      </AbpFormField>
      <AbpButton variant="danger" :disabled="editingBlocked" @click="remove(index)">
        {{ localization.t('AbpUi::Delete') }}: {{ claim.claimType }}
      </AbpButton>
    </div>
    <div v-if="saveFailed" role="alert">
      <p>{{ saveFailureText }}</p>
      <AbpButton
        variant="secondary"
        :disabled="saving || loadingClaims || confirmingReload"
        @click="loadClaims"
      >
        {{ localization.t('AbpUi::Refresh') }}: {{ localization.t('AbpIdentity::Claims') }}
      </AbpButton>
    </div>

    <template #footer="{ close: requestClose }">
      <AbpButton variant="secondary" outline :disabled="saving" @click="requestClose">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton
        v-if="mayManage"
        variant="primary"
        :loading="saving"
        :disabled="
          saving ||
          !claims ||
          !claimTypes ||
          loadingClaims ||
          loadingTypes ||
          claimsFailed ||
          typesFailed ||
          saveFailed
        "
        @click="save"
      >
        {{ localization.t('AbpUi::Save') }}
      </AbpButton>
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
  IdentityRoleService,
  IdentityUserService,
  type ClaimTypeDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import type { IdentityClaimSubject, IdentitySubjectClaim } from '../models/claims.js';
import {
  createIdentityClaimsPayload,
  getIdentityClaimValueError,
  getIdentityClaimValueType,
  hasIdentityClaim,
} from '../utils/claims.js';
import ClaimValueInput from './ClaimValueInput.vue';

const props = defineProps<IdentityClaimSubject>();
const emit = defineEmits<{ close: []; saved: [] }>();
const users = injectAbp(IdentityUserService);
const roles = injectAbp(IdentityRoleService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const permission = usePermission();
const confirmation = useConfirmation();
const toaster = useToaster();
const claims = shallowRef<IdentitySubjectClaim[]>();
const claimTypes = shallowRef<ClaimTypeDto[]>();
const loadingClaims = ref(false);
const loadingTypes = ref(false);
const claimsFailed = ref(false);
const typesFailed = ref(false);
const saveFailed = ref(false);
const saving = ref(false);
const confirmingReload = ref(false);
const dirty = ref(false);
const newType = ref('');
const newValue = ref('');
const submitted = ref(false);
const saveSubmitted = ref(false);
const duplicate = ref(false);
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const mayManage = computed(() => {
  const group = props.provider === 'user' ? 'Users' : 'Roles';
  return permission.isGranted(`AbpIdentity.${group} && AbpIdentity.${group}.Update`);
});
const service = computed(() => (props.provider === 'user' ? users : roles));
const editingBlocked = computed(
  () =>
    saving.value ||
    loadingClaims.value ||
    loadingTypes.value ||
    confirmingReload.value ||
    !claimTypes.value ||
    typesFailed.value ||
    !mayManage.value,
);
const selectedType = computed(() => claimTypes.value?.find(type => type.name === newType.value));
const typeOptions = computed(() =>
  (claimTypes.value ?? []).flatMap(type =>
    type.name ? [{ value: type.name, label: type.name }] : [],
  ),
);
const requiredText = computed(() => localization.t('AbpValidation::ThisFieldIsRequired.'));
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const saveFailureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const newErrors = computed(() => {
  if (!submitted.value) return [];
  const error = getIdentityClaimValueError(newValue.value, selectedType.value);
  if (error === 'required') return [requiredText.value];
  if (error === 'regex' && selectedType.value?.regexDescription) {
    return [regexDescription(selectedType.value.regexDescription)];
  }
  return error ? [localization.t('AbpValidation::ThisFieldIsNotValid.')] : [];
});

function rowErrors(claim: IdentitySubjectClaim): string[] {
  if (!saveSubmitted.value || !claim.claimValue?.trim()) return [];
  const type = claimTypes.value?.find(type => type.name === claim.claimType);
  const error = getIdentityClaimValueError(claim.claimValue, type);
  if (!error) return [];
  return error === 'regex' && type?.regexDescription
    ? [regexDescription(type.regexDescription)]
    : [localization.t('AbpValidation::ThisFieldIsNotValid.')];
}
function regexDescription(description: string): string {
  const separator = description.indexOf('::');
  if (separator < 0) return description;
  const resource = description.slice(0, separator);
  const key = localization.findKey([resource], [description.slice(separator + 2)]);
  return key && (!resource || key.startsWith(`${resource}::`)) ? localization.t(key) : description;
}
let revision = 0;
let closed = false;
const pending = new Set<AbortController>();

async function read(kind: 'types' | 'claims'): Promise<void> {
  if (closed || !mayManage.value || !props.entityId || saving.value) return;
  const loading = kind === 'types' ? loadingTypes : loadingClaims;
  const failed = kind === 'types' ? typesFailed : claimsFailed;
  if (loading.value) return;
  const own = revision;
  const controller = new AbortController();
  pending.add(controller);
  loading.value = true;
  failed.value = false;
  try {
    const options = { signal: controller.signal, skipHandleError: true };
    if (kind === 'types') {
      const result = await service.value.getAllClaimTypes(options);
      if (own === revision && !controller.signal.aborted) claimTypes.value = result;
    } else {
      const result = await service.value.getClaims(props.entityId, options);
      if (own === revision && !controller.signal.aborted) {
        claims.value = result.map(claim => ({ ...claim }));
        dirty.value = false;
        saveFailed.value = false;
      }
    }
  } catch {
    if (own === revision && !controller.signal.aborted) failed.value = true;
  } finally {
    pending.delete(controller);
    if (own === revision) loading.value = false;
  }
}

const loadTypes = () => read('types');
async function loadClaims(): Promise<void> {
  if (closed || saving.value || confirmingReload.value || loadingClaims.value) return;
  const reloadTypes = saveFailed.value;
  if (dirty.value || saveFailed.value) {
    const own = revision;
    confirmingReload.value = true;
    const answer = await confirmation
      .warn(saveFailureText.value, 'AbpUi::AreYouSure')
      .finally(() => {
        if (own === revision) confirmingReload.value = false;
      });
    if (answer !== ConfirmationStatus.confirm || closed || own !== revision) return;
  }
  await Promise.all([read('claims'), reloadTypes ? read('types') : Promise.resolve()]);
}

function add(): void {
  if (closed || editingBlocked.value || !claims.value) return;
  submitted.value = true;
  duplicate.value = false;
  if (!newType.value || !selectedType.value || newErrors.value.length) return;
  duplicate.value = hasIdentityClaim(claims.value, newType.value, newValue.value);
  if (duplicate.value) return;
  claims.value = [...claims.value, { claimType: newType.value, claimValue: newValue.value }];
  dirty.value = true;
  newType.value = '';
  newValue.value = '';
  submitted.value = false;
}

function changeType(value: unknown): void {
  if (!closed && !editingBlocked.value && typeof value === 'string') newType.value = value;
}

function changeValue(value: string): void {
  if (!closed && !editingBlocked.value) newValue.value = value;
}

function updateClaim(index: number, value: string): void {
  if (closed || editingBlocked.value || !claims.value?.[index]) return;
  claims.value = claims.value.map((claim, position) =>
    position === index ? { ...claim, claimValue: value } : claim,
  );
  dirty.value = true;
}

function remove(index: number): void {
  if (closed || editingBlocked.value || !claims.value?.[index]) return;
  claims.value = claims.value.filter((_, position) => position !== index);
  dirty.value = true;
}

async function save(): Promise<void> {
  if (
    closed ||
    saving.value ||
    !mayManage.value ||
    !claims.value ||
    !claimTypes.value ||
    claimsFailed.value ||
    typesFailed.value ||
    saveFailed.value ||
    loadingClaims.value ||
    loadingTypes.value
  )
    return;
  const own = revision;
  saveSubmitted.value = true;
  if (claims.value.some(claim => rowErrors(claim).length > 0)) return;
  const payload = createIdentityClaimsPayload(props, claims.value);
  const controller = new AbortController();
  pending.add(controller);
  saving.value = true;
  saveFailed.value = false;
  try {
    await service.value.updateClaims(props.entityId, payload, {
      signal: controller.signal,
      skipHandleError: true,
    });
    if (own !== revision || controller.signal.aborted || closed) return;
    dirty.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    emit('saved');
    close();
  } catch {
    if (own === revision && !controller.signal.aborted) saveFailed.value = true;
  } finally {
    pending.delete(controller);
    if (own === revision) saving.value = false;
  }
}

function reset(): void {
  revision += 1;
  for (const controller of pending) controller.abort();
  pending.clear();
  claims.value = undefined;
  claimTypes.value = undefined;
  loadingClaims.value = false;
  loadingTypes.value = false;
  claimsFailed.value = false;
  typesFailed.value = false;
  saving.value = false;
  confirmingReload.value = false;
  saveFailed.value = false;
  dirty.value = false;
  newType.value = '';
  newValue.value = '';
  submitted.value = false;
  saveSubmitted.value = false;
  duplicate.value = false;
}

function close(): void {
  if (closed) return;
  closed = true;
  reset();
  emit('close');
}

watch(newType, () => {
  newValue.value = '';
  submitted.value = false;
  duplicate.value = false;
});
watch(
  () => [props.entityId, props.provider, contextKey.value, mayManage.value] as const,
  (current, previous) => {
    reset();
    if (!current[3] || (previous && current[2] !== previous[2])) {
      close();
      return;
    }
    if (!closed) {
      void loadTypes();
      void loadClaims();
    }
  },
  { immediate: true, flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
