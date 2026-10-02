<script setup lang="ts">
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { TenantService } from '@lsw-abpvue/tenant-management/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSpinner,
  AbpToggle,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, watch } from 'vue';

const props = defineProps<{
  /** Whose connection string; the dialog fetches it itself when it opens. */
  tenantId: string;
  tenantName?: string | undefined;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const tenants = injectAbp(TenantService);
const localization = useLocalization();
const toaster = useToaster();

const loading = ref(false);
const busy = ref(false);
const shared = ref(true);
const connectionString = ref('');

async function load(): Promise<void> {
  loading.value = true;

  try {
    const current = await tenants.getDefaultConnectionString(props.tenantId);
    connectionString.value = current;
    // No connection string of its own is what "uses the shared database" means.
    shared.value = current.length === 0;
  } finally {
    loading.value = false;
  }
}

watch(
  visible,
  isOpen => {
    if (isOpen) void load();
  },
  { immediate: true },
);

async function save(): Promise<void> {
  busy.value = true;

  try {
    if (shared.value) await tenants.deleteDefaultConnectionString(props.tenantId);
    else await tenants.updateDefaultConnectionString(props.tenantId, connectionString.value);

    visible.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AbpModal v-model:visible="visible" :busy="busy">
    <template #header>
      <h2 class="h5 mb-0">
        {{ [$t('AbpTenantManagement::ConnectionStrings'), tenantName].filter(Boolean).join(' - ') }}
      </h2>
    </template>

    <AbpSpinner v-if="loading" />

    <template v-else>
      <AbpToggle
        v-model="shared"
        class="mb-3"
        :label="$t('AbpTenantManagement::DisplayName:UseSharedDatabase')"
      />

      <AbpFormField
        v-if="!shared"
        :label="localization.t('AbpTenantManagement::DisplayName:DefaultConnectionString')"
      >
        <template #default="{ id }">
          <AbpInput :id="id" v-model="connectionString" autocomplete="off" />
        </template>
      </AbpFormField>
    </template>

    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">
        {{ $t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton variant="primary" :loading="busy" @click="save">
        {{ $t('AbpUi::Save') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>
