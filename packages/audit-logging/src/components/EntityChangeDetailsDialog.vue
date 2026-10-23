<template>
  <AbpModal v-if="allowed" :visible="true" size="xl" @update:visible="$event || emit('close')">
    <template #header>{{ localization.t('AbpAuditLogging::ChangeDetails') }}</template>
    <AbpSpinner v-if="loading" />
    <p v-else-if="failed" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable')
      }}<AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <EntityChangeDetails v-else-if="data" :item-with-user-name="data" />
    <template #footer="{ close }"
      ><AbpButton variant="secondary" @click="close">{{
        localization.t('AbpUi::Close')
      }}</AbpButton></template
    >
  </AbpModal>
</template>
<script setup lang="ts">
import {
  AuditLogsService,
  type EntityChangeWithUsernameDto,
} from '@lsw-abpvue/audit-logging/proxy';
import { inject } from '@lsw-abpvue/core';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { watch } from 'vue';
import { useAuditLogging } from '../utils/use-audit-logging.js';
import { useAuditRequest } from '../utils/use-audit-request.js';
import { AuditLogResponseError } from '../utils/response-error.js';
import EntityChangeDetails from './EntityChangeDetails.vue';
const props = defineProps<{ entityChangeId: string }>();
const emit = defineEmits<{ close: [] }>();
const service = inject(AuditLogsService);
const { allowed, context, localization } = useAuditLogging();
const { data, loading, failed, run, reset } = useAuditRequest<EntityChangeWithUsernameDto>(context);
async function load(): Promise<void> {
  if (!allowed.value || !props.entityChangeId) return reset();
  const id = props.entityChangeId;
  await run(async signal => {
    const value = await service.getEntityChangeWithUsername(id, { signal, skipHandleError: true });
    if (value.entityChange?.id !== id) throw new AuditLogResponseError();
    return value;
  });
}
watch(() => props.entityChangeId, load, { immediate: true });
watch(context, () => emit('close'), { flush: 'sync' });
</script>
