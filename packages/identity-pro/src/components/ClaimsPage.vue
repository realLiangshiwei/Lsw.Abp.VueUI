<template>
  <AbpPage title="AbpIdentity::ClaimTypes">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpIdentity::ClaimTypes"
      searchable
    />
    <p v-if="listFailed" role="alert">
      {{ failureText }}
      <AbpButton variant="secondary" @click="list.get()">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <p v-if="deletionFailed" role="alert">{{ mutationFailureText }}</p>
    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::ClaimTypes"
      create-title="AbpIdentity::NewClaimType"
      :save="save"
    >
      <AbpSpinner v-if="loading" />
      <div v-else-if="readFailed" role="alert">
        <p>{{ failureText }}</p>
        <AbpButton variant="secondary" @click="edit(pendingType)">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </div>
      <form v-else-if="editor.form.value" novalidate @submit.prevent="save">
        <fieldset :disabled="editor.busy.value || !canSave">
          <AbpExtensibleForm :form="editor.form.value" :record="editor.editing.value" />
        </fieldset>
        <div v-if="mutationFailed" role="alert">
          <p>{{ mutationFailureText }}</p>
          <AbpButton variant="secondary" @click="reloadEditor">
            {{ localization.t('AbpUi::Refresh') }}
          </AbpButton>
        </div>
        <p v-if="editor.editing.value?.isStatic" role="alert">
          {{ localization.t('AbpExceptionHandling::403MessageDetail') }}
        </p>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="editor.busy.value" @click="close">{{
          localization.t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton
          variant="primary"
          :loading="editor.busy.value"
          :disabled="loading || !canSave"
          @click="save"
          >{{ localization.t('AbpUi::Save') }}</AbpButton
        >
      </template>
    </AbpRecordModal>
  </AbpPage>
</template>

<script setup lang="ts">
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  useRecordEditor,
} from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject as injectAbp,
  useListService,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityClaimTypeService, type ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpSpinner,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { IdentityProComponents } from '../enums/components.js';
import { IDENTITY_PRO_CLAIMS_PAGE } from '../tokens/claims-page.token.js';
import {
  getIdentityClaimTypeFormChanges,
  IdentityClaimTypeEditorStateError,
  serializeIdentityClaimTypeCreate,
  serializeIdentityClaimTypeUpdate,
} from '../utils/claim-type-editor.js';

const service = injectAbp(IdentityClaimTypeService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const confirmation = useConfirmation();
const toaster = useToaster();
const list = useListService({ persistKey: IdentityProComponents.Claims });
const listFailed = ref(false);
const deletionFailed = ref(false);
const deleting = ref(false);
const readFailed = ref(false);
const mutationFailed = ref(false);
const loading = ref(false);
const pendingType = shallowRef<ClaimTypeDto>();
let revision = 0;
let request: AbortController | undefined;
const writes = new Set<AbortController>();
class ClaimTypeContextChangedError extends Error {
  constructor() {
    super('The claim type context changed. Open the claim type again to continue.');
    this.name = 'ClaimTypeContextChangedError';
  }
}
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const grants = computed(() => ({
  read: permission.isGranted('AbpIdentity.ClaimTypes'),
  create: permission.isGranted('AbpIdentity.ClaimTypes && AbpIdentity.ClaimTypes.Create'),
  update: permission.isGranted('AbpIdentity.ClaimTypes && AbpIdentity.ClaimTypes.Update'),
  delete: permission.isGranted('AbpIdentity.ClaimTypes && AbpIdentity.ClaimTypes.Delete'),
}));
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const mutationFailureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const { items } = list.hookToQuery(async (query, signal) => {
  if (!grants.value.read) return { items: [], totalCount: 0 };
  try {
    const result = await service.getList(query, { signal, skipHandleError: true });
    if (!signal?.aborted) listFailed.value = false;
    return result;
  } catch (error) {
    if (!signal?.aborted) listFailed.value = true;
    throw error;
  }
});
const editor = useRecordEditor<ClaimTypeDto>({
  identifier: IdentityProComponents.Claims,
  reload: () => list.get(),
  create: () => write(undefined),
  update: id => write(id),
  delete: id => service.delete(id),
  idOf: record => record.id,
  nameOf: record => record.name ?? '',
  stampOf: record => record.concurrencyStamp,
  deletionMessage: 'AbpIdentity::ClaimTypeDeletionConfirmationMessage',
  providers: [{ provide: IDENTITY_PRO_CLAIMS_PAGE, useValue: { add, edit, remove } }],
});
const canSave = computed(
  () =>
    !loading.value &&
    !readFailed.value &&
    !mutationFailed.value &&
    (editor.editing.value
      ? grants.value.update && !editor.editing.value.isStatic
      : grants.value.create),
);

function reset(): void {
  revision += 1;
  request?.abort();
  request = undefined;
  for (const controller of writes) controller.abort();
  writes.clear();
  loading.value = false;
  readFailed.value = false;
  mutationFailed.value = false;
  deleting.value = false;
}

function add(): void {
  if (!grants.value.create || editor.busy.value) return;
  reset();
  pendingType.value = undefined;
  editor.show();
}

async function edit(record?: ClaimTypeDto): Promise<void> {
  if (!record?.id || record.isStatic || !grants.value.update || editor.busy.value) return;
  reset();
  pendingType.value = record;
  editor.show(record);
  const own = revision;
  request = new AbortController();
  const signal = request.signal;
  loading.value = true;
  try {
    const fresh = await service.get(record.id, { signal, skipHandleError: true });
    if (own !== revision || signal.aborted || !editor.open.value) return;
    if (fresh.id !== record.id)
      throw new IdentityClaimTypeEditorStateError(
        'The loaded claim type does not match the selected record. Reload the claim type to continue.',
      );
    editor.show(fresh);
  } catch {
    if (own === revision && !signal.aborted) readFailed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}

async function write(id: string | undefined): Promise<unknown> {
  const controller = new AbortController();
  writes.add(controller);
  const own = revision;
  try {
    const form = editor.form.value;
    if (!form)
      throw new IdentityClaimTypeEditorStateError(
        'The claim type form is unavailable. Reopen the editor before saving.',
      );
    const current = editor.editing.value;
    if (id && (!current || current.id !== id))
      throw new IdentityClaimTypeEditorStateError(
        'The fresh claim type is unavailable. Reload the editor before saving.',
      );
    const changes = getIdentityClaimTypeFormChanges(form, current, editor.injector);
    const options = { signal: controller.signal, skipHandleError: true };
    const result =
      id && current
        ? await service.update(id, serializeIdentityClaimTypeUpdate(current, changes), options)
        : await service.create(serializeIdentityClaimTypeCreate(changes), options);
    if (own !== revision || controller.signal.aborted) throw new ClaimTypeContextChangedError();
    return result;
  } catch (error) {
    if (own === revision && !controller.signal.aborted) mutationFailed.value = true;
    throw error;
  } finally {
    writes.delete(controller);
  }
}

async function save(): Promise<void> {
  if (!canSave.value || editor.busy.value || !editor.open.value) return;
  await editor.save();
}

async function reloadEditor(): Promise<void> {
  if (!mutationFailed.value || editor.busy.value) return;
  const own = revision;
  const answer = await confirmation.warn(mutationFailureText.value, 'AbpUi::AreYouSure');
  if (answer !== ConfirmationStatus.confirm || own !== revision) return;
  if (pendingType.value) await edit(pendingType.value);
  else {
    editor.open.value = false;
    list.get();
  }
}

async function remove(record: ClaimTypeDto): Promise<void> {
  if (!record.id || !grants.value.delete || editor.busy.value || deleting.value) return;
  const own = revision;
  deleting.value = true;
  try {
    const answer = await confirmation.warn(
      'AbpIdentity::ClaimTypeDeletionConfirmationMessage',
      'AbpUi::AreYouSure',
      { messageLocalizationParams: [record.name ?? ''] },
    );
    if (answer !== ConfirmationStatus.confirm || own !== revision || !grants.value.delete) return;
    const controller = new AbortController();
    writes.add(controller);
    deletionFailed.value = false;
    try {
      await service.delete(record.id, { signal: controller.signal, skipHandleError: true });
      if (own !== revision || controller.signal.aborted) return;
      toaster.success('AbpUi::DeletedSuccessfully');
      list.get();
    } catch {
      if (own === revision && !controller.signal.aborted) deletionFailed.value = true;
    } finally {
      writes.delete(controller);
    }
  } finally {
    if (own === revision) deleting.value = false;
  }
}

watch(
  () => editor.open.value,
  open => {
    if (!open) reset();
  },
  { flush: 'sync' },
);
watch(
  [contextKey, grants],
  (current, previous) => {
    if (
      !previous ||
      (current[0] === previous[0] && JSON.stringify(current[1]) === JSON.stringify(previous[1]))
    )
      return;
    reset();
    editor.invalidate?.();
    editor.open.value = false;
    list.get();
  },
  { flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
