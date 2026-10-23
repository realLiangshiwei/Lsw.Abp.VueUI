<template>
  <AbpPage v-if="allowed" title="LanguageManagement::Languages">
    <template #toolbar><AbpPageToolbar :key="context" :data="items" /></template>
    <AbpExtensibleTable
      :key="context"
      :data="items"
      :list="list"
      record-key="id"
      searchable
      caption="LanguageManagement::Languages"
      actions-text="LanguageManagement::Actions"
    />
    <p v-if="error" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <AbpModal
      v-model:visible="open"
      :busy="busy"
      :dirty="form?.form.dirty"
      :aria-label="$t('LanguageManagement::Languages')"
    >
      <template #header>
        <h2 class="h5 mb-0">
          {{ $t(editing ? 'LanguageManagement::Edit' : 'LanguageManagement::CreateNewLanguage')
          }}<span v-if="editing?.displayName"> - {{ editing.displayName }}</span>
        </h2>
      </template>
      <AbpSpinner v-if="busy && !form" />
      <p v-if="loadFailed" role="alert">
        {{ $t('AbpUi::ErrorLoadingDatatable') }}
        <AbpButton variant="secondary" @click="show(editing)">{{ $t('AbpUi::Refresh') }}</AbpButton>
      </p>
      <form v-if="form" id="language-form" @submit.prevent="save">
        <AbpExtensibleForm :form="form" :record="editing" />
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
          $t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton type="submit" form="language-form" :loading="busy" :disabled="!form">{{
          $t('AbpUi::Save')
        }}</AbpButton>
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
  EXTENSIONS_IDENTIFIER,
  useExtensibleForm,
  type ExtensibleForm,
} from '@lsw-abpvue/components';
import { inject, provideAbp, runInInjectionContext } from '@lsw-abpvue/core';
import { LanguageManagementPolicyNames as Policy } from '@lsw-abpvue/language-management/config';
import {
  LanguageService,
  type CreateLanguageDto,
  type CultureInfoDto,
  type LanguageDto,
  type UpdateLanguageDto,
} from '@lsw-abpvue/language-management/proxy';
import {
  AbpButton,
  AbpModal,
  AbpSpinner,
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import { LanguageManagementComponents as Keys } from '../enums/components.js';
import { languageManagementExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { LANGUAGES_PAGE } from '../tokens/pages.token.js';
import { useLanguageManagement } from '../utils/use-language-management.js';

const service = inject(LanguageService);
const state = useLanguageManagement(Keys.Languages, Policy.Languages, service.getList);
const { allowed, context, busy, permission, list, items, error, localization } = state;
const confirmation = useConfirmation();
const toaster = useToaster();
const cultures = shallowRef<CultureInfoDto[]>([]);
const open = ref(false);
const loadFailed = ref(false);
const editing = shallowRef<LanguageDto>();
const form = shallowRef<ExtensibleForm<LanguageDto>>();
let loadRevision = 0;
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: Keys.Languages },
  {
    provide: LANGUAGES_PAGE,
    useValue: {
      cultures: computed(() => cultures.value),
      add: () => show(),
      edit: show,
      remove,
      setAsDefault,
    },
  },
]);
useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });

async function show(record?: LanguageDto): Promise<void> {
  if (busy.value || !permission.isGranted(record ? Policy.LanguagesEdit : Policy.LanguagesCreate))
    return;
  state.cancel();
  const revision = ++loadRevision;
  editing.value = record;
  form.value = undefined;
  loadFailed.value = false;
  open.value = true;
  const loaded = await state.run(
    async signal => {
      const [choices, fresh] = await Promise.all([
        cultures.value.length ? cultures.value : service.getCulturelist({ signal }),
        record?.id ? service.get(record.id, { signal }) : undefined,
      ]);
      return { choices, fresh };
    },
    ({ choices, fresh }) => {
      cultures.value = choices;
      editing.value = fresh;
      form.value = runInInjectionContext(injector, () => useExtensibleForm<LanguageDto>(fresh));
    },
  );
  if (open.value && revision === loadRevision) loadFailed.value = !loaded;
}

async function save(): Promise<void> {
  const current = editing.value;
  const currentForm = form.value;
  if (
    !open.value ||
    !currentForm ||
    !permission.isGranted(current ? Policy.LanguagesEdit : Policy.LanguagesCreate) ||
    !currentForm.form.validate()
  )
    return;
  const values: Record<string, unknown> = {
    displayName: current?.displayName,
    isEnabled: current?.isEnabled,
    ...currentForm.toRequestBody(),
  };
  const input: UpdateLanguageDto = {
    ...values,
    displayName: String(values.displayName || current?.cultureName || values.cultureName || ''),
    isEnabled: values.isEnabled === true,
    concurrencyStamp: current?.concurrencyStamp,
  };
  const saved = await state.run(
    signal => {
      currentForm.form.clearServerErrors();
      if (current?.id) return service.update(current.id, input, { signal });
      const create: CreateLanguageDto = {
        ...input,
        cultureName: String(values.cultureName ?? ''),
        uiCultureName: String(values.uiCultureName ?? ''),
      };
      return service.create(create, { signal });
    },
    () => {
      open.value = false;
      toaster.success('AbpUi::SavedSuccessfully');
      list.get();
    },
  );
  if (saved) await state.refresh();
}

async function remove(record: LanguageDto): Promise<void> {
  const { id } = record;
  if (!id || !permission.isGranted(Policy.LanguagesDelete)) return;
  let removedCulture: string | undefined;
  const own = context.value;
  const deleted = await state.run(
    async signal => {
      const answer = await confirmation.warn(
        record.isDefaultLanguage
          ? 'LanguageManagement::DefaultLanguageDeletionConfirmationMessage'
          : 'LanguageManagement::LanguageDeletionConfirmationMessage',
        'AbpUi::AreYouSure',
        { messageLocalizationParams: [record.displayName ?? record.cultureName ?? ''] },
      );
      if (answer !== ConfirmationStatus.confirm || signal.aborted) return;
      const fresh = await service.get(id, { signal });
      if (signal.aborted) return;
      await service.delete(id, { signal });
      return fresh;
    },
    fresh => {
      if (!fresh) return;
      removedCulture = fresh.cultureName;
      toaster.success('AbpUi::DeletedSuccessfully');
      list.get();
    },
  );
  if (!deleted || !removedCulture) return;
  if (removedCulture === localization.currentLang.value) {
    await state.run(
      async signal => {
        const result = await service.getAllList({ signal });
        if (signal.aborted) return;
        const fallback =
          result.items.find(language => language.isDefaultLanguage && language.isEnabled) ??
          result.items.find(language => language.isEnabled);
        if (fallback?.cultureName) await localization.setLanguage(fallback.cultureName);
      },
      () => {},
    );
  }
  if (own === context.value) await state.refresh();
}

async function setAsDefault(record: LanguageDto): Promise<void> {
  const { id } = record;
  if (!id || !permission.isGranted(Policy.LanguagesChangeDefault)) return;
  const saved = await state.run(
    signal => service.setAsDefault(id, { signal }),
    () => list.getWithoutPageReset(),
  );
  if (saved) await state.refresh();
}

watch(
  open,
  visible => {
    if (!visible) {
      loadRevision += 1;
      state.cancel();
      form.value = undefined;
    }
  },
  { flush: 'sync' },
);
watch(
  context,
  () => {
    open.value = false;
    editing.value = undefined;
    cultures.value = [];
    injector.runInContext(languageManagementExtensionsResolver);
  },
  { flush: 'sync' },
);
</script>
