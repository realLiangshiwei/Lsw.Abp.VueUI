<template>
  <AbpModal
    :visible="true"
    :dirty="false"
    suppress-unsaved-changes-warning
    @update:visible="$event || close()"
  >
    <template #header>{{ localization.t('AbpIdentity::Import') }}</template>

    <form :id="formId" novalidate @submit.prevent="upload">
      <AbpFormField v-slot="control" :label="localization.t('AbpIdentity::Type')">
        <AbpSelect
          :id="control.id"
          v-model="format"
          name="importFormat"
          :options="formats"
          :disabled="busy"
          :aria-describedby="control.describedBy"
        />
      </AbpFormField>
      <AbpButton variant="secondary" outline :disabled="busy" @click="downloadSample">
        {{ localization.t('AbpIdentity::DownloadTemplateFile') }}
      </AbpButton>
      <AbpFormField
        v-slot="control"
        :label="localization.t('AbpIdentity::ChooseFile')"
        :errors="fileErrors"
        :hint="file?.name"
        required
      >
        <input
          :id="control.id"
          ref="fileInput"
          type="file"
          required
          name="importFile"
          class="abp-user-import__file"
          style="display: block; max-width: 100%; padding-block: 0.5rem"
          :accept="format === 'excel' ? '.xlsx' : '.csv'"
          :disabled="busy"
          :aria-describedby="control.describedBy"
          :aria-invalid="control.invalid ? 'true' : undefined"
          @change="selectFile"
        />
        <AbpButton
          v-if="selectedCount > 0"
          variant="secondary"
          outline
          :disabled="busy"
          @click="clearFile"
        >
          {{ localization.t('AbpUi::Clear') }}
        </AbpButton>
      </AbpFormField>

      <div v-if="busy" role="status" aria-live="polite">
        <AbpSpinner :label="localization.t('AbpUi::ProcessingWithThreeDot')" />
        <p>{{ localization.t('AbpUi::ProcessingWithThreeDot') }}</p>
      </div>
      <div v-if="state.status === 'error'" role="alert">
        <p>{{ errorMessage }}</p>
        <AbpButton
          v-if="state.operation === 'sample'"
          variant="secondary"
          :disabled="busy"
          @click="downloadSample"
        >
          {{ localization.t('AbpUi::Refresh') }}
        </AbpButton>
      </div>

      <section v-if="state.result" :aria-label="localization.t('AbpIdentity::Import')">
        <p :id="resultId" role="status" aria-live="polite">
          {{
            state.result.output.isAllSucceeded
              ? localization.t('AbpIdentity::ImportSuccessMessage')
              : localization.t(
                  'AbpIdentity::ImportFailedMessage',
                  String(state.result.output.succeededCount),
                  String(state.result.output.failedCount),
                )
          }}
        </p>
        <div v-if="listRefreshFailed" role="alert">
          <p>
            {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
          </p>
          <AbpButton variant="secondary" :disabled="listRefreshing" @click="emit('refreshList')">
            {{ localization.t('AbpUi::Refresh') }}
          </AbpButton>
        </div>
        <dl
          class="abp-user-import__results"
          style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.5rem 1rem"
        >
          <dt>{{ localization.t('AbpUi::Total') }}</dt>
          <dd style="margin: 0; font-variant-numeric: tabular-nums">
            {{ state.result.output.allCount }}
          </dd>
          <dt>{{ localization.t('AbpUi::SavedSuccessfully') }}</dt>
          <dd style="margin: 0; font-variant-numeric: tabular-nums">
            {{ state.result.output.succeededCount }}
          </dd>
          <dt>{{ localization.t('AbpUi::Error') }}</dt>
          <dd style="margin: 0; font-variant-numeric: tabular-nums">
            {{ state.result.output.failedCount }}
          </dd>
        </dl>
        <AbpButton
          v-if="state.result.output.failedCount > 0 && hasInvalidFile"
          variant="secondary"
          :disabled="busy"
          :aria-describedby="resultId"
          @click="downloadInvalid"
        >
          {{ localization.t('AbpUi::Yes') }}
        </AbpButton>
        <p v-else-if="state.result.output.failedCount > 0" role="status">
          {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
        </p>
      </section>
    </form>

    <template #footer="{ close: requestClose }">
      <AbpButton variant="secondary" outline @click="requestClose">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton
        v-if="!state.result"
        type="submit"
        :form="formId"
        variant="primary"
        :loading="state.status === 'loading' && state.operation === 'upload'"
        :disabled="busy || !mayImport"
      >
        {{ localization.t('AbpIdentity::Upload') }}
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
  WindowService,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  ConfirmationStatus,
  useConfirmation,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, useId, watch } from 'vue';
import type { IdentityUserImportFormat } from '../models/user-import.js';
import {
  createIdentityUserImportController,
  getIdentityUserImportFileError,
} from '../utils/user-import.js';

defineProps<{
  listRefreshFailed?: boolean | undefined;
  listRefreshing?: boolean | undefined;
}>();
const emit = defineEmits<{ imported: []; refreshList: []; close: [] }>();
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const permission = usePermission();
const confirmation = useConfirmation();
const browser = injectAbp(WindowService);
const importer = createIdentityUserImportController(injectAbp(IdentityUserService), (blob, name) =>
  browser.downloadBlob(blob, name),
);
const state = importer.state;
const format = ref<IdentityUserImportFormat>('excel');
const file = shallowRef<File>();
const fileInput = ref<HTMLInputElement>();
const selectedCount = ref(0);
const submitted = ref(false);
const confirming = ref(false);
const formId = useId();
const resultId = useId();
let revision = 0;
let confirmationId: number | undefined;
let closed = false;
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const mayImport = computed(() =>
  permission.isGranted('AbpIdentity.Users && AbpIdentity.Users.Import'),
);
const busy = computed(() => state.value.status === 'loading' || confirming.value);
const formats = computed(() => [
  { value: 'excel', label: localization.t('AbpIdentity::FromExcel') },
  { value: 'csv', label: localization.t('AbpIdentity::FromCSV') },
]);
const hasInvalidFile = computed(() =>
  Boolean(state.value.result?.output.invalidUsersDownloadToken?.trim()),
);
const fileErrors = computed(() => {
  if (!submitted.value) return [];
  if (selectedCount.value > 1) return [localization.t('AbpValidation::ThisFieldIsNotValid.')];
  const invalid = getIdentityUserImportFileError(file.value, format.value);
  if (invalid === 'required') return [localization.t('AbpIdentity::PleaseSelectFile')];
  if (invalid === 'empty') return [localization.t('AbpValidation::ThisFieldIsRequired.')];
  const extension = format.value === 'excel' ? '.xlsx' : '.csv';
  if (invalid === 'type')
    return [
      localization.t(
        'AbpValidation::ThisFieldOnlyAcceptsFilesWithTheFollowingExtensions:{0}',
        extension,
      ),
    ];
  return [];
});
const errorMessage = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));

function reset(): void {
  revision += 1;
  importer.reset();
  if (confirmationId !== undefined && confirmation.current.value?.id === confirmationId)
    confirmation.clear();
  confirmationId = undefined;
}

function selectFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (busy.value || closed) return;
  reset();
  selectedCount.value = input.files?.length ?? 0;
  file.value = input.files?.item(0) ?? undefined;
  submitted.value = true;
}

function clearFile(): void {
  if (busy.value || closed) return;
  clearSelection();
}

function clearSelection(): void {
  reset();
  file.value = undefined;
  selectedCount.value = 0;
  submitted.value = false;
  if (fileInput.value) fileInput.value.value = '';
}

async function downloadSample(): Promise<void> {
  if (busy.value || closed || !mayImport.value) return;
  try {
    await importer.downloadSample(format.value);
  } catch {
    // Raw download errors can contain a capability token and stay out of visible messages.
  }
}

async function upload(): Promise<void> {
  if (busy.value || closed || !mayImport.value || state.value.result) return;
  submitted.value = true;
  if (fileErrors.value.length || !file.value) return;
  const own = revision;
  if (state.value.status === 'error' && state.value.operation === 'upload') {
    confirming.value = true;
    const answer = confirmation.warn('AbpIdentity::Import', 'AbpUi::AreYouSure', {
      dismissible: false,
    });
    confirmationId = confirmation.current.value?.id;
    const result = await answer;
    confirmationId = undefined;
    confirming.value = false;
    if (result !== ConfirmationStatus.confirm || own !== revision || closed || !mayImport.value)
      return;
  }
  try {
    const result = await importer.importFile(file.value, format.value);
    if (
      result &&
      own === revision &&
      !closed &&
      mayImport.value &&
      result.output.succeededCount > 0
    )
      emit('imported');
  } catch {
    // An ambiguous write failure requires a new explicit confirmation before another upload.
  }
}

async function downloadInvalid(): Promise<void> {
  if (busy.value || closed || !mayImport.value || !hasInvalidFile.value) return;
  try {
    await importer.downloadInvalid();
  } catch {
    // Keep the server statistics available while the failed file download can be retried.
  }
}

function close(): void {
  if (closed) return;
  closed = true;
  reset();
  file.value = undefined;
  emit('close');
}

watch(format, clearSelection, { flush: 'sync' });
watch(
  [contextKey, mayImport],
  ([context, allowed], previous) => {
    if (allowed && (previous[0] === undefined || context === previous[0])) return;
    close();
  },
  { immediate: true, flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
