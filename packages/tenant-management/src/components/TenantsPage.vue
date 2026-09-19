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
import {
  inject as injectAbp,
  provideAbp,
  runInInjectionContext,
  useListService,
} from '@lsw-abpvue/core';
import { AbpFeatureManagement } from '@lsw-abpvue/feature-management';
import {
  TenantService,
  type TenantCreateDto,
  type TenantDto,
  type TenantUpdateDto,
} from '@lsw-abpvue/tenant-management/proxy';
import {
  AbpButton,
  AbpInput,
  AbpModal,
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import AbpTenantConnectionString from './AbpTenantConnectionString.vue';
import { TenantManagementComponents } from '../enums/components.js';
import { TENANTS_PAGE } from '../tokens/extensions.token.js';

const tenants = injectAbp(TenantService);
const confirmation = useConfirmation();
const toaster = useToaster();

const list = useListService({ persistKey: 'TenantManagement.Tenants' });
const { items } = list.hookToQuery(query => tenants.getList(query));

const editing = shallowRef<TenantDto>();
const form = shallowRef<ExtensibleForm<TenantDto>>();
const open = ref(false);
const busy = ref(false);

const featuresFor = shallowRef<TenantDto>();
const featuresOpen = ref(false);

const connectionFor = shallowRef<TenantDto>();
const connectionOpen = ref(false);

/**
 * The page says which component key it is, and hands the module's buttons what they run.
 * The injector this returns is also the one to build forms in later: an `inject()` after
 * this line still sees the parent's (api-parity-map §2).
 */
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: TenantManagementComponents.Tenants },
  {
    provide: TENANTS_PAGE,
    useValue: { add, edit, remove, manageFeatures, manageConnectionString },
  },
]);

useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });

function show(tenant?: TenantDto): void {
  editing.value = tenant;
  form.value = runInInjectionContext(injector, () => useExtensibleForm<TenantDto>(tenant));
  open.value = true;
}

function add(): void {
  show();
}

async function edit(tenant: TenantDto): Promise<void> {
  show(await tenants.get(tenant.id ?? ''));
}

async function save(): Promise<void> {
  if (!form.value?.form.validate()) return;

  const body = form.value.toRequestBody();
  busy.value = true;

  try {
    // The fields came from the extension system, so their shape is only known at
    // runtime; the server is what rejects a body that is missing something.
    const current = editing.value;
    if (current?.id) {
      await tenants.update(current.id, {
        ...body,
        concurrencyStamp: current.concurrencyStamp,
      } as unknown as TenantUpdateDto);
    } else {
      await tenants.create(body as unknown as TenantCreateDto);
    }

    open.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    list.get();
  } finally {
    busy.value = false;
  }
}

async function remove(tenant: TenantDto): Promise<void> {
  const answer = await confirmation.warn(
    'AbpTenantManagement::TenantDeletionConfirmationMessage',
    'AbpUi::AreYouSure',
    { messageLocalizationParams: [tenant.name ?? ''] },
  );
  if (answer !== ConfirmationStatus.confirm) return;

  await tenants.delete(tenant.id ?? '');
  toaster.success('AbpUi::DeletedSuccessfully');
  list.get();
}

function manageFeatures(tenant: TenantDto): void {
  featuresFor.value = tenant;
  featuresOpen.value = true;
}

function manageConnectionString(tenant: TenantDto): void {
  connectionFor.value = tenant;
  connectionOpen.value = true;
}
</script>

<template>
  <AbpPage title="AbpTenantManagement::Tenants">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>

    <AbpInput
      v-model="list.filter.value"
      type="search"
      class="mb-3"
      :placeholder="$t('AbpUi::PagerSearch')"
      :aria-label="$t('AbpUi::PagerSearch')"
    />

    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpTenantManagement::Tenants"
    />

    <AbpModal v-model:visible="open" :busy="busy" :aria-label="$t('AbpTenantManagement::Tenants')">
      <template #header>
        <h2 class="h5 mb-0">
          {{ editing ? $t('AbpUi::Edit') : $t('AbpTenantManagement::NewTenant') }}
        </h2>
      </template>

      <AbpExtensibleForm v-if="form" :form="form" :record="editing" />

      <template #footer>
        <AbpButton variant="secondary" outline :disabled="busy" @click="open = false">
          {{ $t('AbpUi::Cancel') }}
        </AbpButton>
        <AbpButton variant="primary" :loading="busy" @click="save">
          {{ $t('AbpUi::Save') }}
        </AbpButton>
      </template>
    </AbpModal>

    <AbpFeatureManagement
      v-if="featuresFor"
      v-model:visible="featuresOpen"
      provider-name="T"
      :provider-key="featuresFor.id ?? ''"
      :provider-title="featuresFor.name ?? ''"
    />

    <AbpTenantConnectionString
      v-if="connectionFor"
      v-model:visible="connectionOpen"
      :tenant-id="connectionFor.id ?? ''"
      :tenant-name="connectionFor.name ?? ''"
    />
  </AbpPage>
</template>
