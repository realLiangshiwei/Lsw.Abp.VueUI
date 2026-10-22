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
            <tr v-if="!changes.length">
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
      <section v-if="detail" :aria-label="localization.t('AbpAuditLogging::Detail')">
        <h4>{{ localization.t('AbpAuditLogging::Detail') }}</h4>
        <dl>
          <dt>{{ localization.t('AbpAuditLogging::EntityId') }}</dt>
          <dd>{{ detail.entityChange?.entityId }}</dd>
          <dt>{{ localization.t('AbpAuditLogging::EntityTypeFullName') }}</dt>
          <dd>{{ detail.entityChange?.entityTypeFullName }}</dd>
          <dt>{{ localization.t('AbpAuditLogging::UserName') }}</dt>
          <dd>{{ detail.userName }}</dd>
        </dl>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th scope="col">{{ localization.t('AbpAuditLogging::PropertyName') }}</th>
                <th scope="col">{{ localization.t('AbpAuditLogging::OriginalValue') }}</th>
                <th scope="col">{{ localization.t('AbpAuditLogging::NewValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="property in detail.entityChange?.propertyChanges" :key="property.id">
                <th scope="row">{{ property.propertyName }}</th>
                <td style="white-space: pre-wrap; overflow-wrap: anywhere">
                  {{ property.originalValue }}
                </td>
                <td style="white-space: pre-wrap; overflow-wrap: anywhere">
                  {{ property.newValue }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
const props = defineProps<{ entityId: string; entityTypeFullName: string }>();
const emit = defineEmits<{ close: [] }>();
const service = injectAbp(AuditLogsService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const changes = shallowRef<EntityChangeWithUsernameDto[]>([]);
const selected = shallowRef<EntityChangeWithUsernameDto>();
const detail = shallowRef<EntityChangeWithUsernameDto>();
const loading = ref(false);
const failed = ref(false);
const loadingDetails = ref(false);
const detailsFailed = ref(false);
let revision = 0;
let controller = new AbortController();
let detailController: AbortController | undefined;
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    config.snapshot().auth.grantedPolicies,
  ]),
);
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
function date(value?: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return value ?? '';
  return new Intl.DateTimeFormat(
    config.snapshot().localization.currentCulture?.cultureName ?? undefined,
    { dateStyle: 'short', timeStyle: 'short' },
  ).format(new Date(value));
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
function reset(): void {
  revision += 1;
  controller.abort();
  controller = new AbortController();
  detailController?.abort();
  changes.value = [];
  selected.value = undefined;
  detail.value = undefined;
  loading.value = false;
  failed.value = false;
  loadingDetails.value = false;
  detailsFailed.value = false;
}
async function load(): Promise<void> {
  reset();
  if (!props.entityId || !props.entityTypeFullName) return;
  const own = revision;
  const signal = controller.signal;
  loading.value = true;
  try {
    const values = await service.getEntityChangesWithUsername(
      { entityId: props.entityId, entityTypeFullName: props.entityTypeFullName },
      { signal, skipHandleError: true },
    );
    if (own !== revision || signal.aborted) return;
    if (values.some(value => !matches(value)))
      throw new TypeError('The entity history does not match the selected entity.');
    changes.value = values;
  } catch {
    if (own === revision && !signal.aborted) failed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}
async function details(item: EntityChangeWithUsernameDto): Promise<void> {
  if (!matches(item) || !item.entityChange?.id) return;
  detailController?.abort();
  const request = new AbortController();
  detailController = request;
  const own = revision;
  const signal = AbortSignal.any([request.signal, controller.signal]);
  selected.value = item;
  detail.value = undefined;
  loadingDetails.value = true;
  detailsFailed.value = false;
  try {
    const value = await service.getEntityChangeWithUsername(item.entityChange.id, {
      signal,
      skipHandleError: true,
    });
    if (own !== revision || signal.aborted) return;
    if (!matches(value) || value.entityChange?.id !== item.entityChange.id)
      throw new TypeError('The entity change does not match the selected record.');
    detail.value = value;
  } catch {
    if (own === revision && !signal.aborted) detailsFailed.value = true;
  } finally {
    if (own === revision && !signal.aborted) loadingDetails.value = false;
  }
}
watch([() => props.entityId, () => props.entityTypeFullName], load, { immediate: true });
watch(
  context,
  () => {
    reset();
    emit('close');
  },
  { flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
