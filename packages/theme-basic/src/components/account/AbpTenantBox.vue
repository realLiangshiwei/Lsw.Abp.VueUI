<script setup lang="ts">
import { useTenantBox } from '@lsw-abpvue/account-core';
import { useLocalization } from '@lsw-abpvue/core';
import { useToaster } from '@lsw-abpvue/theme-shared';
import { ref, watch } from 'vue';
import AbpButton from '../AbpButton.vue';
import AbpFormField from '../AbpFormField.vue';
import AbpInput from '../AbpInput.vue';
import AbpModal from '../AbpModal.vue';

const tenantBox = useTenantBox();
const localization = useLocalization();
const toaster = useToaster();

const open = ref(false);
const busy = ref(false);
const name = ref('');

// Opening starts from the tenant that is set, so confirming without typing changes nothing.
watch(open, isOpen => {
  if (isOpen) name.value = tenantBox.currentTenant.value?.name ?? '';
});

async function save(): Promise<void> {
  busy.value = true;

  try {
    if (await tenantBox.switchTo(name.value.trim())) {
      open.value = false;
      return;
    }

    toaster.error('AbpUiMultiTenancy::GivenTenantIsNotAvailable', undefined, {
      messageLocalizationParams: [name.value],
    });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="card shadow-sm mb-3">
    <div class="card-body d-flex align-items-center justify-content-between gap-3">
      <div>
        <small class="text-uppercase text-body-secondary">
          {{ $t('AbpUiMultiTenancy::Tenant') }}
        </small>
        <h2 class="h6 m-0 fst-italic">
          {{ tenantBox.currentTenant.value?.name || $t('AbpUiMultiTenancy::NotSelected') }}
        </h2>
      </div>

      <AbpButton id="AbpTenantSwitchLink" size="sm" variant="primary" outline @click="open = true">
        {{ $t('AbpUiMultiTenancy::Switch') }}
      </AbpButton>
    </div>
  </div>

  <AbpModal v-model:visible="open" :busy="busy">
    <template #header>
      <h2 class="h5 mb-0">{{ $t('AbpUiMultiTenancy::SwitchTenant') }}</h2>
    </template>

    <form @submit.prevent="save">
      <AbpFormField :label="localization.t('AbpUiMultiTenancy::Name')">
        <template #default="field">
          <AbpInput :id="field.id" v-model="name" name="tenant" autocomplete="organization" />
        </template>
      </AbpFormField>

      <p class="text-body-secondary mb-0">{{ $t('AbpUiMultiTenancy::SwitchTenantHint') }}</p>
    </form>

    <template #footer>
      <AbpButton variant="secondary" outline :disabled="busy" @click="open = false">
        {{ $t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton variant="primary" :loading="busy" @click="save">
        {{ $t('AbpUi::Save') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>
