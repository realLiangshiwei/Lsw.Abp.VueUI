<template>
  <AbpPage title="Saas::Editions">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <p v-if="error" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="list.get">{{ $t('AbpUi::Refresh') }}</AbpButton>
    </p>
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="Saas::Editions"
      searchable
    />
    <SaasRecordDialog :state="state" title="Saas::Editions" create-title="Saas::NewEdition" />
    <AbpReplaceable
      v-if="featuresFor"
      v-model:visible="featuresOpen"
      :replaceable-key="FeatureManagementComponents.FeatureManagement"
      provider-name="E"
      :provider-key="featuresFor.id ?? ''"
      :provider-title="featuresFor.displayName ?? ''"
    >
      <AbpFeatureManagement
        v-model:visible="featuresOpen"
        provider-name="E"
        :provider-key="featuresFor.id ?? ''"
        :provider-title="featuresFor.displayName ?? ''"
      />
    </AbpReplaceable>
    <EditionTenantsDialog
      v-if="tenantsOperation"
      :key="`${tenantsOperation.mode}:${tenantsOperation.edition.id}`"
      :mode="tenantsOperation.mode"
      :edition="tenantsOperation.edition"
      @close="tenantsOperation = undefined"
      @saved="list.getWithoutPageReset"
    />
  </AbpPage>
</template>

<script setup lang="ts">
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import { AbpExtensibleTable, AbpPage, AbpPageToolbar } from '@lsw-abpvue/components';
import {
  AbpReplaceable,
  ConfigStateService,
  inject as injectAbp,
  useListService,
  usePermission,
} from '@lsw-abpvue/core';
import { AbpFeatureManagement, FeatureManagementComponents } from '@lsw-abpvue/feature-management';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import { EditionService, type EditionDto, type PlanDto } from '@lsw-abpvue/saas/proxy';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import { SaasComponents } from '../enums/components.js';
import { SAAS_EDITIONS_PAGE, type SaasEditionsPageCommands } from '../tokens/pages.token.js';
import { editionCreate, editionUpdate } from '../utils/form-values.js';
import { useSaasEditor } from '../utils/use-saas-editor.js';
import { useSaasOperation } from '../utils/use-saas-operation.js';
import EditionTenantsDialog from './EditionTenantsDialog.vue';
import SaasRecordDialog from './SaasRecordDialog.vue';

const editions = injectAbp(EditionService);
const config = injectAbp(ConfigStateService);
const history = injectAbp(SHOW_ENTITY_HISTORY, { optional: true });
const permission = usePermission();
const operation = useSaasOperation(SaasPolicyNames.Editions);
const list = useListService({ persistKey: SaasComponents.Editions });
const { items, error } = list.hookToQuery(async (query, listSignal) => {
  if (!operation.allowed.value) return { items: [], totalCount: 0 };
  const signal = AbortSignal.any([listSignal, operation.signal]);
  const result = await editions.getList(query, { signal });
  return signal.aborted || !operation.allowed.value ? { items: [], totalCount: 0 } : result;
});
const plans = shallowRef<PlanDto[]>([]);
const featuresFor = shallowRef<EditionDto>();
const featuresOpen = ref(false);
const tenantsOperation = shallowRef<{ edition: EditionDto; mode: 'move' | 'delete' }>();
const commands: SaasEditionsPageCommands = {
  add: () => {
    void state.show();
  },
  edit: edition => {
    void state.show(edition);
  },
  remove: edition => showTenants(edition, 'delete'),
  moveAllTenants: edition => showTenants(edition, 'move'),
  manageFeatures: edition => {
    if (may(SaasPolicyNames.EditionsManageFeatures)) {
      featuresFor.value = edition;
      featuresOpen.value = true;
    }
  },
  viewHistory: edition => {
    if (edition.id && may(SaasPolicyNames.EditionsChangeHistory))
      history?.(edition.id, 'Volo.Saas.Editions.Edition');
  },
  planOptions: computed(() => [
    { value: null, label: '-' },
    ...plans.value.map(plan => ({ value: plan.id ?? '', label: plan.name ?? '' })),
  ]),
};
const state = useSaasEditor<EditionDto>({
  identifier: SaasComponents.Editions,
  policy: SaasPolicyNames.Editions,
  providers: [{ provide: SAAS_EDITIONS_PAGE, useValue: commands }],
  load: async (record, signal) => {
    const [fresh, lookup] = await Promise.all([
      record?.id ? editions.get(record.id, { signal }) : Promise.resolve(undefined),
      editions.getPlanLookup({ signal }),
    ]);
    if (!signal.aborted) plans.value = lookup;
    return fresh;
  },
  create: (values, options) => editions.create(editionCreate(values), options),
  update: (id, values, options) => editions.update(id, editionUpdate(values), options),
  reload: () => list.getWithoutPageReset(),
});
function may(policy: string) {
  return operation.allowed.value && permission.isGranted(policy);
}
function showTenants(edition: EditionDto, mode: 'move' | 'delete') {
  if (
    edition.id &&
    may(mode === 'delete' ? SaasPolicyNames.EditionsDelete : SaasPolicyNames.TenantsUpdate)
  )
    tenantsOperation.value = { edition, mode };
}
watch([operation.context, operation.allowed], () => {
  items.value = [];
  list.totalCount.value = 0;
  plans.value = [];
  featuresFor.value = undefined;
  tenantsOperation.value = undefined;
  list.get();
});
watch(
  () => config.snapshot().auth.grantedPolicies,
  () => {
    if (!may(SaasPolicyNames.EditionsManageFeatures)) {
      featuresFor.value = undefined;
      featuresOpen.value = false;
    }
  },
);
</script>
