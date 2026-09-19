<script setup lang="ts">
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  useRecordEditor,
} from '@lsw-abpvue/components';
import { inject as injectAbp, useListService } from '@lsw-abpvue/core';
import { AbpFeatureManagement } from '@lsw-abpvue/feature-management';
import {
  TenantService,
  type TenantCreateDto,
  type TenantDto,
  type TenantUpdateDto,
} from '@lsw-abpvue/tenant-management/proxy';
import { AbpButton, AbpInput, AbpModal } from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import AbpTenantConnectionString from './AbpTenantConnectionString.vue';
import { TenantManagementComponents } from '../enums/components.js';
import { TENANTS_PAGE } from '../tokens/extensions.token.js';

const tenants = injectAbp(TenantService);

const list = useListService({ persistKey: 'TenantManagement.Tenants' });
const { items } = list.hookToQuery(query => tenants.getList(query));

const featuresFor = shallowRef<TenantDto>();
const featuresOpen = ref(false);

const connectionFor = shallowRef<TenantDto>();
const connectionOpen = ref(false);

function manageFeatures(tenant: TenantDto): void {
  featuresFor.value = tenant;
  featuresOpen.value = true;
}

function manageConnectionString(tenant: TenantDto): void {
  connectionFor.value = tenant;
  connectionOpen.value = true;
}

const editor = useRecordEditor<TenantDto>({
  identifier: TenantManagementComponents.Tenants,
  reload: () => list.get(),
  // The extension system decides the fields, so the body's shape is only known at runtime.
  create: body => tenants.create(body as unknown as TenantCreateDto),
  update: (id, body) => tenants.update(id, body as unknown as TenantUpdateDto),
  delete: id => tenants.delete(id),
  idOf: tenant => tenant.id,
  stampOf: tenant => tenant.concurrencyStamp,
  nameOf: tenant => tenant.name ?? '',
  deletionMessage: 'AbpTenantManagement::TenantDeletionConfirmationMessage',
  providers: [
    {
      provide: TENANTS_PAGE,
      useValue: {
        add: () => editor.show(),
        edit: async (tenant: TenantDto) => editor.show(await tenants.get(tenant.id ?? '')),
        remove: (tenant: TenantDto) => editor.remove(tenant),
        manageFeatures,
        manageConnectionString,
      },
    },
  ],
});
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

    <AbpModal
      v-model:visible="editor.open.value"
      :busy="editor.busy.value"
      :aria-label="$t('AbpTenantManagement::Tenants')"
    >
      <template #header>
        <h2 class="h5 mb-0">
          {{ editor.editing.value ? $t('AbpUi::Edit') : $t('AbpTenantManagement::NewTenant') }}
        </h2>
      </template>

      <AbpExtensibleForm
        v-if="editor.form.value"
        :form="editor.form.value"
        :record="editor.editing.value"
      />

      <template #footer>
        <AbpButton
          variant="secondary"
          outline
          :disabled="editor.busy.value"
          @click="editor.open.value = false"
        >
          {{ $t('AbpUi::Cancel') }}
        </AbpButton>
        <AbpButton variant="primary" :loading="editor.busy.value" @click="editor.save()">
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
