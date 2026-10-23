<template>
  <section
    v-if="allowed"
    class="abp-audit-settings"
    :aria-label="localization.t('AbpAuditLogging::Menu:AuditLogging')"
  >
    <AbpTabList
      v-model="tab"
      :items="tabs"
      orientation="horizontal"
      :aria-label="localization.t('AbpAuditLogging::Menu:AuditLogging')"
    />
    <AbpSpinner v-if="loading" />
    <p v-else-if="readFailed" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable')
      }}<AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <form v-else-if="ready" novalidate :aria-label="localization.t(title)" @submit.prevent="save">
      <fieldset :disabled="saving || saved">
        <AbpFormField
          v-if="tab === 'global'"
          v-slot="control"
          :label="localization.t('AbpAuditLogging::DisplayName:IsPeriodicDeleterEnabled')"
        >
          <AbpToggle
            :id="control.id"
            v-model="draft.isPeriodicDeleterEnabled"
            name="isPeriodicDeleterEnabled"
          />
          <small>{{
            localization.t('AbpAuditLogging::Description:IsPeriodicDeleterEnabled')
          }}</small>
        </AbpFormField>
        <template v-if="tab !== 'global' || draft.isPeriodicDeleterEnabled">
          <AbpFormField
            v-slot="control"
            :label="
              localization.t(
                `AbpAuditLogging::DisplayName:${tab === 'global' ? 'GlobalIsExpiredDeleterEnabled' : 'IsExpiredDeleterEnabled'}`,
              )
            "
          >
            <AbpToggle
              :id="control.id"
              v-model="draft.isExpiredDeleterEnabled"
              name="isExpiredDeleterEnabled"
            />
            <small>{{
              localization.t(
                `AbpAuditLogging::Description:${tab === 'global' ? 'GlobalIsExpiredDeleterEnabled' : 'IsExpiredDeleterEnabled'}`,
              )
            }}</small>
          </AbpFormField>
          <AbpFormField
            v-if="draft.isExpiredDeleterEnabled"
            v-slot="control"
            :label="localization.t('AbpAuditLogging::DisplayName:ExpiredDeleterPeriod')"
            :errors="
              invalid ? [localization.t('AbpAuditLogging::InvalidAuditLogDeletionSettings')] : []
            "
          >
            <AbpInput
              :id="control.id"
              v-model="draft.expiredDeleterPeriod"
              type="number"
              name="expiredDeleterPeriod"
              :min="1"
              :max="2147483647"
              :step="1"
              :invalid="control.invalid"
              :aria-describedby="control.describedBy"
            />
            <span>{{ localization.t('AbpAuditLogging::ExpiredDeleterPeriodUnit') }}</span>
            <p v-if="cutoff">
              {{ localization.t('AbpAuditLogging::AuditLogsBeforeXWillBeDeleted', cutoff) }}
            </p>
          </AbpFormField>
        </template>
        <AbpButton variant="primary" type="submit" :loading="saving">{{
          localization.t('AbpAccount::Save')
        }}</AbpButton>
      </fieldset>
      <p v-if="saveFailed" role="alert">{{ saveError }}</p>
      <AbpButton v-if="saved" variant="secondary" :disabled="saving" @click="refresh">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </form>
  </section>
</template>
<script setup lang="ts">
import { AbpTabList } from '@lsw-abpvue/components';
import {
  AuditLogSettingsService,
  type AuditLogGlobalSettingsDto,
} from '@lsw-abpvue/audit-logging/proxy';
import {
  AbpHttpError,
  ConfigStateService,
  inject,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpSpinner,
  AbpToggle,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { AuditLoggingPolicyNames } from '../enums/route-names.js';
const service = inject(AuditLogSettingsService);
const config = inject(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const tenant = computed(() => !!config.snapshot().currentTenant.id);
const allowed = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted(AuditLoggingPolicyNames.SettingManagement) &&
    config.snapshot().features.values['AuditLogging.SettingManagement']?.toLowerCase() !== 'false',
);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentTenant.id,
    config.snapshot().currentUser.isAuthenticated,
    allowed.value,
  ]),
);
const tab = ref(tenant.value ? 'general' : 'global');
const tabs = computed(() => [
  ...(!tenant.value ? [{ name: 'global', text: 'AbpAuditLogging::AuditLogSettingsGlobal' }] : []),
  { name: 'general', text: 'AbpAuditLogging::AuditLogSettingsGeneral' },
]);
const title = computed(() =>
  tab.value === 'global'
    ? 'AbpAuditLogging::AuditLogSettingsGlobal'
    : 'AbpAuditLogging::AuditLogSettingsGeneral',
);
const defaults = () => ({
  isPeriodicDeleterEnabled: false,
  isExpiredDeleterEnabled: false,
  expiredDeleterPeriod: 0,
});
const draft = reactive(defaults());
const loading = ref(false);
const saving = ref(false);
const ready = ref(false);
const readFailed = ref(false);
const saveFailed = ref(false);
const saved = ref(false);
const saveError = ref('');
const invalid = ref(false);
let controller = new AbortController();
const cutoff = computed(() => {
  const days = Number(draft.expiredDeleterPeriod);
  if (!Number.isInteger(days) || days <= 0 || days > 2147483647) return '';
  const value = new Date();
  value.setDate(value.getDate() - days);
  return Number.isFinite(value.getTime())
    ? new Intl.DateTimeFormat(config.snapshot().localization.currentCulture.cultureName).format(
        value,
      )
    : '';
});
function reset(): void {
  controller.abort();
  controller = new AbortController();
  ready.value =
    loading.value =
    saving.value =
    readFailed.value =
    saveFailed.value =
    invalid.value =
      false;
  saveError.value = '';
  saved.value = false;
  Object.assign(draft, defaults());
}
async function load(): Promise<void> {
  reset();
  if (!allowed.value || (tab.value === 'global' && tenant.value)) return;
  loading.value = true;
  const signal = controller.signal;
  try {
    const value: AuditLogGlobalSettingsDto =
      tab.value === 'global'
        ? await service.getGlobal({ signal, skipHandleError: true })
        : await service.get({ signal, skipHandleError: true });
    if (signal.aborted) return;
    Object.assign(draft, {
      isPeriodicDeleterEnabled: value.isPeriodicDeleterEnabled ?? false,
      isExpiredDeleterEnabled: value.isExpiredDeleterEnabled ?? false,
      expiredDeleterPeriod: value.expiredDeleterPeriod ?? 0,
    });
    ready.value = true;
  } catch {
    if (!signal.aborted) readFailed.value = true;
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}
async function save(): Promise<void> {
  if (
    !allowed.value ||
    !ready.value ||
    saving.value ||
    saved.value ||
    (tab.value === 'global' && tenant.value)
  )
    return;
  const period = draft.isExpiredDeleterEnabled ? Number(draft.expiredDeleterPeriod) : 0;
  invalid.value =
    draft.isExpiredDeleterEnabled &&
    (!Number.isInteger(period) || period <= 0 || period > 2147483647);
  if (invalid.value) return;
  saving.value = true;
  saveFailed.value = false;
  const signal = controller.signal;
  const input = {
    isExpiredDeleterEnabled: draft.isExpiredDeleterEnabled,
    expiredDeleterPeriod: period,
  };
  try {
    if (tab.value === 'global')
      await service.updateGlobal(
        { ...input, isPeriodicDeleterEnabled: draft.isPeriodicDeleterEnabled },
        { signal, skipHandleError: true },
      );
    else await service.update(input, { signal, skipHandleError: true });
    if (signal.aborted) return;
    saved.value = true;
    await refresh();
  } catch (error) {
    if (!signal.aborted) reportFailure(error);
  } finally {
    if (!signal.aborted) saving.value = false;
  }
}
async function refresh(): Promise<void> {
  if (!saved.value || !allowed.value) return;
  const signal = controller.signal;
  saving.value = true;
  saveFailed.value = false;
  try {
    await config.refreshAppState();
    if (!signal.aborted) {
      saved.value = false;
      toaster.success('AbpUi::SavedSuccessfully');
    }
  } catch (error) {
    if (!signal.aborted) reportFailure(error);
  } finally {
    if (!signal.aborted) saving.value = false;
  }
}
function reportFailure(error: unknown): void {
  saveFailed.value = true;
  const body = error instanceof AbpHttpError ? error.error : undefined;
  saveError.value =
    [body?.message, ...(body?.validationErrors?.map(value => value.message) ?? [])]
      .filter(Boolean)
      .join('\n') || localization.t('AbpUi::DefaultErrorMessage');
}
watch(
  context,
  () => {
    reset();
    tab.value = tenant.value ? 'general' : 'global';
  },
  { flush: 'sync' },
);
watch([context, tab], load, { immediate: true });
onBeforeUnmount(reset);
</script>
