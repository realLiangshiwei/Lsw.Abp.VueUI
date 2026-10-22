<template>
  <AbpModal
    :visible="true"
    :dirty="false"
    suppress-unsaved-changes-warning
    @update:visible="$event || close()"
  >
    <template #header>{{ localization.t('AbpIdentity::Search') }}</template>

    <form :id="formId" novalidate @submit.prevent="find">
      <AbpFormField v-slot="control" :label="localization.t('AbpIdentity::Search')">
        <AbpSelect
          :id="control.id"
          v-model="mode"
          name="findBy"
          :options="modes"
          :aria-describedby="control.describedBy"
        />
      </AbpFormField>
      <AbpFormField v-slot="control" :label="inputLabel" :errors="inputErrors" required>
        <AbpInput
          :id="control.id"
          v-model="value"
          name="findValue"
          autocomplete="off"
          autocapitalize="none"
          :spellcheck="false"
          :aria-describedby="control.describedBy"
          :invalid="control.invalid"
        />
      </AbpFormField>
      <AbpSpinner v-if="loading" />
      <p v-if="loader.state.value.status === 'not-found'" role="status">
        {{ localization.t('AbpIdentity::UserNotFound') }}
      </p>
      <div v-if="loadError" role="alert">
        <p>{{ loadError }}</p>
        <AbpButton variant="secondary" @click="find">
          {{ localization.t('AbpUi::Refresh') }}
        </AbpButton>
      </div>
    </form>

    <template #footer="{ close: requestClose }">
      <AbpButton variant="secondary" outline @click="requestClose">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton
        type="submit"
        :form="formId"
        variant="primary"
        :loading="loading"
        :disabled="loading || !mayFind"
      >
        {{ localization.t('AbpIdentity::Search') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import {
  AbpHttpError,
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSelect,
  AbpSpinner,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { IdentityUserFindMode } from '../models/user-find.js';
import {
  createIdentityUserFindLoader,
  getIdentityUserFindValidationError,
} from '../utils/user-find.js';

const emit = defineEmits<{ found: [userId: string]; close: [] }>();
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const permission = usePermission();
const loader = createIdentityUserFindLoader(injectAbp(IdentityUserService));
const mode = ref<IdentityUserFindMode>('id');
const value = ref('');
const submitted = ref(false);
const formId = useId();
let revision = 0;
let closed = false;
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const mayFind = computed(() =>
  permission.isGranted('AbpIdentity.Users && AbpIdentity.Users.ViewDetails'),
);
const modes = computed(() => [
  { value: 'id', label: localization.t('AbpIdentity::DisplayName:UserId') },
  { value: 'userName', label: localization.t('AbpIdentity::UserName') },
  { value: 'email', label: localization.t('AbpIdentity::EmailAddress') },
]);
const inputLabel = computed(() => modes.value.find(item => item.value === mode.value)?.label);
const loading = computed(() => loader.state.value.status === 'loading');
const inputErrors = computed(() => {
  if (!submitted.value) return [];
  const invalid = getIdentityUserFindValidationError({ mode: mode.value, value: value.value });
  if (invalid === 'required') return [localization.t('AbpValidation::ThisFieldIsRequired.')];
  if (invalid === 'id') return [localization.t('AbpValidation::ThisFieldIsNotValid.')];
  if (invalid === 'path') return [localization.t('AbpValidation::ThisFieldIsNotValid.')];
  return [];
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

async function find(): Promise<void> {
  if (closed || !mayFind.value || loading.value) return;
  submitted.value = true;
  if (inputErrors.value.length) return;
  const own = ++revision;
  try {
    const user = await loader.find({ mode: mode.value, value: value.value });
    if (user?.id && own === revision && mayFind.value) emit('found', user.id);
  } catch {
    // The current failure remains visible with an explicit retry inside this dialog.
  }
}

function reset(): void {
  revision += 1;
  loader.reset();
}

function close(): void {
  if (closed) return;
  closed = true;
  reset();
  emit('close');
}

watch(
  [mode, value],
  () => {
    reset();
    submitted.value = false;
  },
  { flush: 'sync' },
);
watch(
  [contextKey, mayFind],
  ([context, allowed], previous) => {
    if (allowed && (previous[0] === undefined || context === previous[0])) return;
    close();
  },
  { immediate: true, flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
