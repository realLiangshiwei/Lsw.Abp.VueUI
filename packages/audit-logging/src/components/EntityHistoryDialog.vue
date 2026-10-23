<template>
  <AbpModal :visible="true" size="xl" @update:visible="$event || emit('close')">
    <template #header>
      {{ localization.t('AbpAuditLogging::ChangeHistory') }}
      <span style="display: block">{{ entityTypeFullName }}</span>
      <small style="display: block">({{ entityId }})</small>
    </template>
    <AbpSpinner v-if="loading" />
    <div v-else-if="failed" role="alert">
      <p>{{ failureText }}</p>
      <AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <template v-else>
      <div class="table-responsive">
        <table class="table table-striped">
          <caption class="visually-hidden">
            {{
              localization.t('AbpAuditLogging::ChangeHistory')
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ localization.t('AbpAuditLogging::ChangeTime') }}</th>
              <th scope="col">{{ localization.t('AbpAuditLogging::UserName') }}</th>
              <th scope="col">{{ localization.t('AbpAuditLogging::ChangeType') }}</th>
              <th scope="col">{{ localization.t('AbpUi::Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in changes" :key="item.entityChange?.id">
              <td>{{ date(item.entityChange?.changeTime) }}</td>
              <td>{{ item.userName }}</td>
              <td>{{ changeType(item.entityChange?.changeType) }}</td>
              <td>
                <AbpButton variant="secondary" size="sm" @click="details(item)">{{
                  localization.t('AbpAuditLogging::Detail')
                }}</AbpButton>
              </td>
            </tr>
            <tr v-if="!changes?.length">
              <td colspan="4">{{ localization.t('AbpUi::NoDataAvailableInDatatable') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AbpSpinner v-if="loadingDetails" />
      <p v-if="detailsFailed" role="alert">
        {{ failureText
        }}<AbpButton variant="secondary" @click="selected && details(selected)">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </p>
      <EntityChangeDetails v-if="detail" :item-with-user-name="detail" />
    </template>
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
import { ConfigStateService, inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, shallowRef, watch } from 'vue';
import { AuditLogResponseError } from '../utils/response-error.js';
import { formatAuditDate } from '../utils/use-audit-logging.js';
import { useAuditRequest } from '../utils/use-audit-request.js';
import EntityChangeDetails from './EntityChangeDetails.vue';
const props = defineProps<{ entityId: string; entityTypeFullName: string }>();
const emit = defineEmits<{ close: [] }>();
const service = injectAbp(AuditLogsService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const selected = shallowRef<EntityChangeWithUsernameDto>();
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    config.snapshot().auth.grantedPolicies,
  ]),
);
const {
  data: changes,
  loading,
  failed,
  run: readHistory,
  reset: resetHistory,
} = useAuditRequest<EntityChangeWithUsernameDto[]>(context);
const {
  data: detail,
  loading: loadingDetails,
  failed: detailsFailed,
  run: readDetail,
  reset: resetDetail,
} = useAuditRequest<EntityChangeWithUsernameDto>(context);
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
function date(value?: string): string {
  return formatAuditDate(
    value,
    config.snapshot().localization.currentCulture?.cultureName ?? undefined,
  );
}
function changeType(value?: number): string {
  if (value === undefined) return '';
  const key = ['AbpAuditLogging::Created', 'AbpAuditLogging::Updated', 'AbpAuditLogging::Deleted'][
    value
  ];
  return key ? localization.t(key) : String(value);
}
function matches(value: EntityChangeWithUsernameDto): boolean {
  return (
    value.entityChange?.entityId === props.entityId &&
    value.entityChange.entityTypeFullName === props.entityTypeFullName
  );
}
async function load(): Promise<void> {
  resetDetail();
  selected.value = undefined;
  if (!props.entityId || !props.entityTypeFullName) {
    resetHistory();
    return;
  }
  await readHistory(async signal => {
    const values = await service.getEntityChangesWithUsername(
      { entityId: props.entityId, entityTypeFullName: props.entityTypeFullName },
      { signal, skipHandleError: true },
    );
    if (values.some(value => !matches(value))) throw new AuditLogResponseError();
    return values;
  });
}
async function details(item: EntityChangeWithUsernameDto): Promise<void> {
  if (!matches(item) || !item.entityChange?.id) return;
  const id = item.entityChange.id;
  selected.value = item;
  await readDetail(async signal => {
    const value = await service.getEntityChangeWithUsername(id, {
      signal,
      skipHandleError: true,
    });
    if (!matches(value) || value.entityChange?.id !== id) throw new AuditLogResponseError();
    return value;
  });
}
watch([() => props.entityId, () => props.entityTypeFullName], load, { immediate: true });
watch(
  context,
  () => {
    selected.value = undefined;
    emit('close');
  },
  { flush: 'sync' },
);
</script>
