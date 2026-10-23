<template>
  <AbpPage v-if="allowed" title="LanguageManagement::LanguageTexts">
    <template #toolbar><AbpPageToolbar :key="context" :data="items" /></template>
    <form class="abp-language-texts-filters row g-3 mb-3" @submit.prevent="list.get()">
      <div class="col-12 col-md-3">
        <label class="form-label" for="base-culture">{{
          $t('LanguageManagement::BaseCultureName')
        }}</label>
        <AbpSelect
          id="base-culture"
          v-model="filters.baseCultureName"
          :options="languageOptions"
          :disabled="busy"
        />
      </div>
      <div class="col-12 col-md-3">
        <label class="form-label" for="target-culture">{{
          $t('LanguageManagement::TargetCultureName')
        }}</label>
        <AbpSelect
          id="target-culture"
          v-model="filters.targetCultureName"
          :options="languageOptions"
          :disabled="busy"
        />
      </div>
      <div class="col-12 col-md-3">
        <label class="form-label" for="resource-name">{{
          $t('LanguageManagement::ResourceName')
        }}</label>
        <AbpSelect
          id="resource-name"
          v-model="resourceName"
          :options="resourceOptions"
          :placeholder="$t('LanguageManagement::All')"
          :disabled="busy"
        />
      </div>
      <div class="col-12 col-md-3">
        <label class="form-label" for="empty-values">{{
          $t('LanguageManagement::TargetValue')
        }}</label>
        <AbpSelect
          id="empty-values"
          v-model="filters.getOnlyEmptyValues"
          :options="emptyOptions"
          :disabled="busy"
        />
      </div>
    </form>
    <p v-if="resourcesFailed" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="loadResources">{{ $t('AbpUi::Refresh') }}</AbpButton>
    </p>
    <AbpExtensibleTable
      :key="context"
      :data="items"
      :list="list"
      searchable
      caption="LanguageManagement::LanguageTexts"
      actions-text="LanguageManagement::Actions"
    />
    <p v-if="error" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="list.getWithoutPageReset()">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <AbpModal
      :key="selectedKey"
      v-model:visible="open"
      :busy="busy"
      :dirty="value !== (selected?.value ?? '')"
      size="lg"
      :aria-label="$t('LanguageManagement::Edit')"
    >
      <template #header
        ><h2 class="h5 mb-0">{{ $t('LanguageManagement::Edit') }}</h2></template
      >
      <template v-if="selected">
        <p>
          <span>{{ $t('LanguageManagement::Key') }}</span
          ><br /><strong>{{ selected.name }}</strong>
        </p>
        <label class="form-label" for="base-value">{{ $t('LanguageManagement::BaseValue') }}</label>
        <textarea
          id="base-value"
          class="form-control mb-3"
          rows="4"
          :value="selected.baseValue"
          disabled
        />
        <label class="form-label" for="target-value">{{
          $t('LanguageManagement::TargetValue')
        }}</label>
        <textarea
          id="target-value"
          v-model="value"
          class="form-control"
          rows="4"
          :disabled="busy"
          @keyup.enter="save()"
        />
      </template>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
          $t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton variant="secondary" outline :disabled="busy || !mayEdit" @click="restore">{{
          $t('LanguageManagement::RestoreToDefault')
        }}</AbpButton>
        <AbpButton :loading="busy" :disabled="!mayEdit" @click="save()">{{
          $t('AbpUi::Save')
        }}</AbpButton>
        <AbpButton variant="success" :disabled="busy || !mayEdit" @click="save(true)">{{
          $t('LanguageManagement::SaveAndNext')
        }}</AbpButton>
      </template>
    </AbpModal>
  </AbpPage>
</template>

<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  EXTENSIONS_IDENTIFIER,
} from '@lsw-abpvue/components';
import { ConfigStateService, inject, provideAbp } from '@lsw-abpvue/core';
import { LanguageManagementPolicyNames as Policy } from '@lsw-abpvue/language-management/config';
import {
  LanguageService,
  LanguageTextService,
  type GetLanguagesTextsInput,
  type LanguageResourceDto,
  type LanguageTextDto,
} from '@lsw-abpvue/language-management/proxy';
import { AbpButton, AbpModal, AbpSelect, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import { LanguageManagementComponents as Keys } from '../enums/components.js';
import { languageManagementExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { LANGUAGE_TEXTS_PAGE } from '../tokens/pages.token.js';
import { useLanguageManagement } from '../utils/use-language-management.js';

const config = inject(ConfigStateService);
const service = inject(LanguageTextService);
const languageService = inject(LanguageService);
const toaster = useToaster();
const languages = computed(() => config.snapshot().localization.languages);
function initialFilters() {
  return {
    baseCultureName: languages.value[0]?.cultureName ?? '',
    targetCultureName: languages.value[1]?.cultureName ?? languages.value[0]?.cultureName ?? '',
    getOnlyEmptyValues: false,
  };
}
const filters = ref(initialFilters());
const resourceName = ref<string | null>(null);
const state = useLanguageManagement(Keys.LanguageTexts, Policy.LanguageTexts, (query, options) => {
  if (!filters.value.baseCultureName || !filters.value.targetCultureName)
    return Promise.resolve({ items: [], totalCount: 0 });
  return service.getList(
    { ...query, ...filters.value, resourceName: resourceName.value ?? undefined },
    options,
  );
});
const { allowed, context, busy, permission, list, items, error, localization } = state;
const languageOptions = computed(() =>
  languages.value.map(language => ({
    label: language.displayName ?? language.cultureName ?? '',
    value: language.cultureName || null,
  })),
);
const resources = shallowRef<LanguageResourceDto[]>([]);
const resourcesFailed = ref(false);
const resourceOptions = computed(() => [
  { label: localization.t('LanguageManagement::All'), value: null },
  ...resources.value.map(resource => ({
    label: resource.name ?? '',
    value: resource.name || null,
  })),
]);
const emptyOptions = computed(() => [
  { label: localization.t('LanguageManagement::All'), value: false },
  { label: localization.t('LanguageManagement::OnlyEmptyValues'), value: true },
]);
const open = ref(false);
const selected = shallowRef<LanguageTextDto>();
let selectedOffset = -1;
const selectedKey = computed(() =>
  JSON.stringify([selected.value?.resourceName, selected.value?.cultureName, selected.value?.name]),
);
const value = ref('');
const mayEdit = computed(() => allowed.value && permission.isGranted(Policy.LanguageTextsEdit));
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: Keys.LanguageTexts },
  { provide: LANGUAGE_TEXTS_PAGE, useValue: { edit, save, restore } },
]);

async function loadResources(): Promise<void> {
  const own = context.value;
  resourcesFailed.value = false;
  const loaded = await state.run(
    signal => languageService.getResources({ signal }),
    result => {
      resources.value = result;
    },
  );
  if (own === context.value) resourcesFailed.value = !loaded;
}
function edit(record: LanguageTextDto): void {
  if (!mayEdit.value || busy.value || !record.resourceName || !record.cultureName || !record.name)
    return;
  selected.value = { ...record };
  const index = items.value.findIndex(
    item => item.name === record.name && item.resourceName === record.resourceName,
  );
  selectedOffset = index < 0 ? -1 : list.page.value * list.maxResultCount.value + index;
  value.value = record.value ?? '';
  open.value = true;
}

async function save(next = false): Promise<void> {
  const { resourceName: resource, cultureName: culture, name } = selected.value ?? {};
  if (!open.value || !mayEdit.value || !resource || !culture || !name) return;
  const draft = value.value;
  const query: GetLanguagesTextsInput = {
    ...list.query.value,
    ...filters.value,
    resourceName: resourceName.value ?? undefined,
  };
  const offset = selectedOffset;
  const saved = await state.run(
    async signal => {
      const following =
        next && offset >= 0
          ? (
              await service.getList(
                { ...query, skipCount: offset + 1, maxResultCount: 1 },
                { signal },
              )
            ).items[0]
          : undefined;
      if (signal.aborted) return;
      await service.update(resource, culture, name, draft, { signal });
      if (!following || signal.aborted) return;
      try {
        // One changed row can move its successor by at most one position.
        const skipCount = Math.max(0, offset - 1);
        const result = await service.getList(
          { ...query, skipCount, maxResultCount: 3 },
          { signal },
        );
        const index = result.items.findIndex(
          item => item.name === following.name && item.resourceName === following.resourceName,
        );
        const fresh = result.items[index];
        if (fresh) return { following: fresh, offset: skipCount + index };
      } catch {
        // The write succeeded; a failed navigation must not invite resubmitting it.
      }
    },
    result => {
      if (result) {
        selected.value = { ...result.following };
        value.value = result.following.value ?? '';
        selectedOffset = result.offset;
        list.page.value = Math.floor(selectedOffset / list.maxResultCount.value);
      } else open.value = false;
      toaster.success('AbpUi::SavedSuccessfully');
      list.getWithoutPageReset();
    },
  );
  if (saved) await state.refresh();
}

async function restore(): Promise<void> {
  const { resourceName: resource, cultureName: culture, name } = selected.value ?? {};
  if (!open.value || !mayEdit.value || !resource || !culture || !name) return;
  const restored = await state.run(
    signal => service.restoreToDefault(resource, culture, name, { signal }),
    () => {
      open.value = false;
      list.getWithoutPageReset();
    },
  );
  if (restored) await state.refresh();
}

watch(
  open,
  visible => {
    if (!visible) {
      state.cancel();
      selected.value = undefined;
      value.value = '';
    }
  },
  { flush: 'sync' },
);
watch(
  [filters, resourceName],
  () => {
    open.value = false;
    list.get();
  },
  { deep: true },
);
watch(
  context,
  () => {
    open.value = false;
    resources.value = [];
    resourceName.value = null;
    filters.value = initialFilters();
    injector.runInContext(languageManagementExtensionsResolver);
    void loadResources();
  },
  { flush: 'sync', immediate: true },
);
watch(languages, () => {
  if (
    !languages.value.some(language => language.cultureName === filters.value.baseCultureName) ||
    !languages.value.some(language => language.cultureName === filters.value.targetCultureName)
  )
    filters.value = initialFilters();
});
</script>
