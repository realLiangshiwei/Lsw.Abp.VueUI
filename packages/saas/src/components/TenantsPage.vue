<template>
  <AbpPage title="Saas::Tenants">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <TenantFilters
      :key="`${operation.context.value}:${operation.allowed.value}`"
      :editions="editionOptions"
      @apply="applyFilters"
    />
    <p v-if="error" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="list.get">{{ $t('AbpUi::Refresh') }}</AbpButton>
    </p>
    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="Saas::Tenants"
      searchable
    />
    <SaasRecordDialog
      :state="state"
      title="Saas::Tenants"
      create-title="Saas::NewTenant"
      :dirty="connectionDirty"
    >
      <template #default="{ form, record }">
        <AbpExtensibleForm :form="form" :record="record" />
        <details v-if="!record && connectionEnabled" ref="connectionDetails" class="mt-3">
          <summary>{{ $t('Saas::ConnectionStrings') }}</summary>
          <AbpReplaceable
            v-model="connectionStrings"
            :replaceable-key="SaasComponents.ConnectionStrings"
            :disabled="editor.busy.value"
          >
            <ConnectionStringsForm
              ref="connectionForm"
              v-model="connectionStrings"
              :disabled="editor.busy.value"
            />
          </AbpReplaceable>
        </details>
      </template>
    </SaasRecordDialog>
    <AbpReplaceable
      v-if="featuresFor"
      v-model:visible="featuresOpen"
      :replaceable-key="FeatureManagementComponents.FeatureManagement"
      provider-name="T"
      :provider-key="featuresFor.id ?? ''"
      :provider-title="featuresFor.name ?? ''"
    >
      <AbpFeatureManagement
        v-model:visible="featuresOpen"
        provider-name="T"
        :provider-key="featuresFor.id ?? ''"
        :provider-title="featuresFor.name ?? ''"
      />
    </AbpReplaceable>
    <TenantConnectionStringsDialog
      v-if="connectionFor"
      :key="connectionFor.id ?? ''"
      :tenant="connectionFor"
      @close="connectionFor = undefined"
      @saved="list.getWithoutPageReset"
    />
    <AbpReplaceable
      v-if="tenantOperation?.mode === 'password'"
      :replaceable-key="SaasComponents.SetTenantPassword"
      :tenant-id="tenantOperation.tenant.id ?? ''"
      :tenant-name="tenantOperation.tenant.name"
      @close="tenantOperation = undefined"
    >
      <TenantOperationDialog
        :key="tenantOperation.tenant.id ?? ''"
        :tenant-id="tenantOperation.tenant.id ?? ''"
        :tenant-name="tenantOperation.tenant.name"
        @close="tenantOperation = undefined"
      />
    </AbpReplaceable>
    <TenantOperationDialog
      v-else-if="tenantOperation"
      :key="`${tenantOperation.mode}:${tenantOperation.tenant.id}`"
      :tenant-id="tenantOperation.tenant.id ?? ''"
      :tenant-name="tenantOperation.tenant.name"
      :mode="tenantOperation.mode"
      @close="tenantOperation = undefined"
    />
  </AbpPage>
</template>

<script setup lang="ts">
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
} from '@lsw-abpvue/components';
import {
  AbpReplaceable,
  ConfigStateService,
  EnvironmentService,
  inject as injectAbp,
  useEventBus,
  useListService,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { AbpFeatureManagement, FeatureManagementComponents } from '@lsw-abpvue/feature-management';
import {
  SAAS_CONNECTION_STRING_SETTING,
  SaasEvents,
  SaasPolicyNames,
} from '@lsw-abpvue/saas/config';
import {
  TenantService,
  type EditionLookupDto,
  type GetTenantsInput,
  type SaasTenantConnectionStringsDto,
  type SaasTenantDto,
} from '@lsw-abpvue/saas/proxy';
import { AbpButton, useConfirmation, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { SaasComponents } from '../enums/components.js';
import {
  SAAS_TENANTS_PAGE,
  TENANT_FORM_ASYNC_VALIDATORS_TOKEN,
  TENANT_FORM_VALIDATORS_TOKEN,
  type SaasTenantsPageCommands,
  type TenantOperation,
} from '../tokens/pages.token.js';
import { tenantCreate, tenantUpdate } from '../utils/form-values.js';
import { canImpersonateTenant } from '../utils/tenant.js';
import { useSaasEditor } from '../utils/use-saas-editor.js';
import { useSaasOperation } from '../utils/use-saas-operation.js';
import ConnectionStringsForm from './ConnectionStringsForm.vue';
import SaasRecordDialog from './SaasRecordDialog.vue';
import TenantConnectionStringsDialog from './TenantConnectionStringsDialog.vue';
import TenantFilters from './TenantFilters.vue';
import TenantOperationDialog from './TenantOperationDialog.vue';

const tenants = injectAbp(TenantService);
const config = injectAbp(ConfigStateService);
const environment = injectAbp(EnvironmentService);
const history = injectAbp(SHOW_ENTITY_HISTORY, { optional: true });
const permission = usePermission();
const localization = useLocalization();
const confirmation = useConfirmation();
const toaster = useToaster();
const operation = useSaasOperation(SaasPolicyNames.Tenants);
const events = useEventBus();
const list = useListService({ persistKey: SaasComponents.Tenants });
const filters = shallowRef<GetTenantsInput>({});
const { items, error } = list.hookToQuery(async (query, listSignal) => {
  if (!operation.allowed.value) return { items: [], totalCount: 0 };
  const signal = AbortSignal.any([listSignal, operation.signal]);
  const result = await tenants.getList(
    { ...query, ...filters.value, getEditionNames: true },
    { signal },
  );
  return signal.aborted || !operation.allowed.value ? { items: [], totalCount: 0 } : result;
});
const editions = shallowRef<EditionLookupDto[]>([]);
const editionOptions = computed(() => [
  { value: null, label: localization.t('AbpUi::NotAssigned') },
  ...editions.value.map(edition => ({ value: edition.id ?? '', label: edition.displayName ?? '' })),
]);
const connectionEnabled = computed(
  () => config.getSetting(SAAS_CONNECTION_STRING_SETTING).value === 'True',
);
const connectionStrings = ref<SaasTenantConnectionStringsDto>({ default: '', databases: [] });
const connectionDirty = computed(
  () => !!connectionStrings.value.default || !!connectionStrings.value.databases?.length,
);
const connectionForm = useTemplateRef('connectionForm');
const connectionDetails = useTemplateRef<HTMLDetailsElement>('connectionDetails');
const featuresFor = shallowRef<SaasTenantDto>();
const featuresOpen = ref(false);
const connectionFor = shallowRef<SaasTenantDto>();
const tenantOperation = shallowRef<{ tenant: SaasTenantDto; mode: TenantOperation }>();
const confirming = ref(false);
const commands: SaasTenantsPageCommands = {
  add: () => {
    void state.show();
  },
  edit: tenant => {
    void state.show(tenant);
  },
  remove,
  manageFeatures: tenant => {
    if (may(SaasPolicyNames.TenantsManageFeatures)) {
      featuresFor.value = tenant;
      featuresOpen.value = true;
    }
  },
  manageConnectionStrings: tenant => {
    if (connectionEnabled.value && may(SaasPolicyNames.TenantsManageConnectionStrings))
      connectionFor.value = tenant;
  },
  applyDatabaseMigrations: tenant => {
    void migrate(tenant);
  },
  viewHistory: tenant => {
    if (tenant.id && may(SaasPolicyNames.TenantsChangeHistory))
      history?.(tenant.id, 'Volo.Saas.Tenants.Tenant');
  },
  operate: (tenant, mode) => {
    const policy = {
      password: SaasPolicyNames.TenantsSetPassword,
      invite: SaasPolicyNames.TenantsCreate,
      impersonate: SaasPolicyNames.TenantsImpersonation,
    }[mode];
    if (
      may(policy) &&
      (mode !== 'impersonate' || canImpersonateTenant(tenant, config, environment))
    )
      tenantOperation.value = { tenant, mode };
  },
  editionOptions,
  formValues: computed(() => editor.form.value?.form.value ?? {}),
};
const state = useSaasEditor<SaasTenantDto>({
  identifier: SaasComponents.Tenants,
  policy: SaasPolicyNames.Tenants,
  providers: [{ provide: SAAS_TENANTS_PAGE, useValue: commands }],
  validators: injectAbp(TENANT_FORM_VALIDATORS_TOKEN, { optional: true }) ?? [],
  asyncValidators: injectAbp(TENANT_FORM_ASYNC_VALIDATORS_TOKEN, { optional: true }) ?? [],
  load: async (record, signal) => {
    connectionStrings.value = { default: '', databases: [] };
    const [fresh, lookup] = await Promise.all([
      record?.id ? tenants.get(record.id, { signal }) : Promise.resolve(undefined),
      tenants.getEditionLookup({ signal }),
    ]);
    if (!signal.aborted) editions.value = lookup;
    return fresh;
  },
  create: (values, options) =>
    tenants.create(
      {
        ...tenantCreate(values),
        connectionStrings: connectionEnabled.value
          ? connectionStrings.value
          : { default: '', databases: [] },
      },
      options,
    ),
  update: (id, values, options) => tenants.update(id, tenantUpdate(values), options),
  reload: () => list.getWithoutPageReset(),
  onSaved: (reason, record, context) =>
    events.emit(SaasEvents.TenantsChanged, {
      context,
      reason,
      tenantIds: record.id ? [record.id] : undefined,
    }),
});
const { editor } = state;
const baseSave = state.save;
state.save = async () => {
  if (
    !editor.editing.value &&
    connectionEnabled.value &&
    connectionForm.value &&
    !connectionForm.value.validate()
  ) {
    if (connectionDetails.value) connectionDetails.value.open = true;
    return;
  }
  await baseSave();
};

function may(policy: string) {
  return operation.allowed.value && permission.isGranted(policy);
}
function applyFilters(value: GetTenantsInput) {
  filters.value = value;
  list.get();
}
async function remove(tenant: SaasTenantDto) {
  if (!tenant.id || confirming.value || operation.busy.value || !may(SaasPolicyNames.TenantsDelete))
    return;
  confirming.value = true;
  const context = operation.context.value;
  const eventContext = operation.eventContext.value;
  const tenantId = tenant.id;
  try {
    const answer = await confirmation.warn(
      'Saas::TenantDeletionConfirmationMessage',
      'AbpUi::AreYouSure',
      { messageLocalizationParams: [tenant.name ?? ''] },
    );
    if (
      answer !== 'confirm' ||
      context !== operation.context.value ||
      !may(SaasPolicyNames.TenantsDelete)
    )
      return;
    await operation.run(
      signal => tenants.delete(tenant.id ?? '', { signal }),
      () => {
        toaster.success('AbpUi::DeletedSuccessfully');
        list.getWithoutPageReset();
        events.emit(SaasEvents.TenantsChanged, {
          context: eventContext,
          reason: 'deleted',
          tenantIds: [tenantId],
        });
      },
    );
  } finally {
    confirming.value = false;
  }
}
async function migrate(tenant: SaasTenantDto) {
  if (
    !tenant.id ||
    !tenant.hasDefaultConnectionString ||
    !may(SaasPolicyNames.TenantsManageConnectionStrings)
  )
    return;
  await operation.run(
    signal => tenants.applyDatabaseMigrations(tenant.id ?? '', { signal }),
    () => toaster.info('Saas::DatabaseMigrationQueuedAndWillBeApplied'),
  );
}
watch([operation.context, operation.allowed], () => {
  items.value = [];
  list.totalCount.value = 0;
  filters.value = {};
  editions.value = [];
  featuresFor.value = undefined;
  connectionFor.value = undefined;
  tenantOperation.value = undefined;
  list.get();
  if (operation.allowed.value) void loadEditions();
});
watch(
  () => config.snapshot().auth.grantedPolicies,
  () => {
    if (!may(SaasPolicyNames.TenantsManageFeatures)) {
      featuresFor.value = undefined;
      featuresOpen.value = false;
    }
    if (!may(SaasPolicyNames.TenantsManageConnectionStrings)) connectionFor.value = undefined;
  },
);
async function loadEditions() {
  await operation.run(
    signal => tenants.getEditionLookup({ signal }),
    lookup => {
      editions.value = lookup;
    },
  );
}
onMounted(loadEditions);
</script>
