<template>
  <AbpModal :visible="true" :busy="busy" size="lg" @update:visible="$event || emit('close')">
    <template #header>{{ $t('Saas::ConnectionStrings') }} - {{ tenant.name }}</template>
    <AbpReplaceable
      v-model="strings"
      :replaceable-key="SaasComponents.ConnectionStrings"
      :tenant-id="tenant.id"
      :disabled="busy"
    >
      <ConnectionStringsForm ref="form" v-model="strings" :tenant-id="tenant.id" :disabled="busy" />
    </AbpReplaceable>
    <p v-if="failed" role="alert">{{ $t('AbpUi::ErrorLoadingDatatable') }}</p>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
        $t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton :loading="busy" :disabled="!allowed || !enabled" @click="save">{{
        $t('AbpUi::Save')
      }}</AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { AbpReplaceable, ConfigStateService, inject as injectAbp } from '@lsw-abpvue/core';
import { SAAS_CONNECTION_STRING_SETTING, SaasPolicyNames } from '@lsw-abpvue/saas/config';
import {
  TenantService,
  type SaasTenantConnectionStringsDto,
  type SaasTenantDto,
} from '@lsw-abpvue/saas/proxy';
import { AbpButton, AbpModal, useToaster } from '@lsw-abpvue/theme-shared';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { SaasComponents } from '../enums/components.js';
import { useSaasOperation } from '../utils/use-saas-operation.js';
import ConnectionStringsForm from './ConnectionStringsForm.vue';

const props = defineProps<{ tenant: SaasTenantDto }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const tenants = injectAbp(TenantService);
const config = injectAbp(ConfigStateService);
const toaster = useToaster();
const strings = ref<SaasTenantConnectionStringsDto>({ default: '', databases: [] });
const form = useTemplateRef('form');
const operation = useSaasOperation(SaasPolicyNames.TenantsManageConnectionStrings);
const { busy, failed, allowed } = operation;
const enabled = computed(() => config.getSetting(SAAS_CONNECTION_STRING_SETTING).value === 'True');
watch([operation.context, allowed, enabled], () => emit('close'));
async function save() {
  if (!props.tenant.id || !enabled.value || (form.value && !form.value.validate())) return;
  await operation.run(
    signal => tenants.updateConnectionStrings(props.tenant.id ?? '', strings.value, { signal }),
    () => {
      toaster.success('AbpUi::SavedSuccessfully');
      emit('saved');
      emit('close');
    },
  );
}
</script>
