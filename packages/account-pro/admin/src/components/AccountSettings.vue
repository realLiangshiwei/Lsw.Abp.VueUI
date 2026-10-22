<template>
  <div class="abp-account-settings" style="max-width: 52rem">
    <AbpTabList
      v-model="selected"
      :items="tabs"
      orientation="horizontal"
      class="flex-wrap mb-3"
      :aria-label="$t('AbpAccount::Menu:Account')"
    />
    <p v-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton variant="secondary" :disabled="busy || !allowed" @click="load">{{
      $t('AbpUi::Refresh')
    }}</AbpButton>
    <form v-if="draft && group" class="mt-3" @submit.prevent="save">
      <fieldset :disabled="busy || !allowed || needsReload">
        <template v-for="field in fields" :key="field.key">
          <AbpToggle
            v-if="!field.type"
            :model-value="Boolean(draft[field.key])"
            :label="$t(field.label)"
            @update:model-value="draft[field.key] = $event"
          />
          <AbpFormField v-else v-slot="control" :label="$t(field.label)">
            <AbpSelect
              v-if="field.choices"
              :id="control.id"
              :model-value="String(draft[field.key])"
              :options="field.choices.map(item => ({ value: item.value, label: item.label }))"
              @update:model-value="draft[field.key] = Number($event)"
            />
            <AbpInput
              v-else
              :id="control.id"
              :name="field.key"
              :type="field.type === 'choice' ? 'text' : field.type"
              :model-value="String(draft[field.key] ?? '')"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              autocomplete="off"
              @update:model-value="
                draft[field.key] = field.type === 'number' ? Number($event) : $event
              "
            />
          </AbpFormField>
        </template>
        <fieldset
          v-for="provider in externalProviders"
          :key="provider.name ?? ''"
          class="border rounded p-3 my-3"
        >
          <legend class="fs-5">{{ provider.name }}</legend>
          <AbpToggle
            v-model="provider.enabled"
            :label="$t('AbpAccount::ExternalProviderEnabled')"
          />
          <AbpToggle
            v-if="!isTenant"
            v-model="provider.enabledForTenantUser"
            :label="$t('AbpAccount::ExternalProviderEnabledForTenant')"
          />
          <AbpToggle
            v-if="isTenant"
            v-model="provider.useCustomSettings"
            :label="$t('AbpAccount::ExternalProviderOverrideHostValue')"
          />
          <template v-if="!isTenant || provider.useCustomSettings">
            <AbpFormField
              v-for="property in provider.properties"
              :key="property.name ?? ''"
              v-slot="control"
              :label="providerPropertyLabel(provider.name, property.name)"
            >
              <AbpInput
                :id="control.id"
                :model-value="property.value ?? ''"
                autocomplete="off"
                @update:model-value="property.value = String($event ?? '')"
              />
            </AbpFormField>
            <AbpFormField
              v-for="property in provider.secretProperties"
              :key="property.name ?? ''"
              v-slot="control"
              :label="providerPropertyLabel(provider.name, property.name)"
            >
              <AbpInput
                :id="control.id"
                type="password"
                :model-value="property.value ?? ''"
                autocomplete="new-password"
                @update:model-value="property.value = String($event ?? '')"
              />
            </AbpFormField>
          </template>
        </fieldset>
        <AbpButton type="submit" :loading="busy">{{ $t('AbpUi::Save') }}</AbpButton>
      </fieldset>
    </form>
  </div>
</template>
<script setup lang="ts">
import { AbpTabList } from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpToggle,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, toRaw, watch } from 'vue';
import { accountSettingGroups } from '../defaults/settings.js';
import type {
  AccountAdminSettings,
  AccountSettingSection,
  ExternalProviderSettings,
} from '../models/settings.js';
import { AccountSettingsService } from '@lsw-abpvue/account-pro/proxy';
import { applySettingChanges } from '../utils/settings.js';

const service = injectAbp(AccountSettingsService);
const sections = {
  general: { get: service.get, update: service.update },
  twoFactor: { get: service.getTwoFactor, update: service.updateTwoFactor },
  captcha: { get: service.getRecaptcha, update: service.updateRecaptcha },
  external: { get: service.getExternalProvider, update: service.updateExternalProvider },
  idle: { get: service.getIdle, update: service.updateIdle },
  passkey: { get: service.getPasskey, update: service.updatePasskey },
  emailLogin: { get: service.getEmailLogin, update: service.updateEmailLogin },
};
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const selected = ref<AccountSettingSection>('general');
const busy = ref(false);
const failed = ref(false);
const needsReload = ref(false);
const draft = ref<Record<string, unknown>>();
const tenantCapabilities = ref({ captcha: false, external: false });
let baseline: Record<string, unknown> = {};
let controller = new AbortController();
let revision = 0;
const isTenant = computed(() => Boolean(config.snapshot().currentTenant.id));
const allowed = computed(
  () =>
    permission.isGranted<string>('AbpAccount.SettingManagement') &&
    (!isTenant.value || config.snapshot().multiTenancy.userSharingStrategy !== 1),
);
const groups = computed(() =>
  accountSettingGroups.filter(
    item =>
      (item.name !== 'twoFactor' ||
        config.snapshot().features.values['Identity.TwoFactor'] === 'Optional') &&
      (!isTenant.value || item.name !== 'captcha' || tenantCapabilities.value.captcha) &&
      (!isTenant.value || item.name !== 'external' || tenantCapabilities.value.external),
  ),
);
const tabs = computed(() => groups.value.map(item => ({ name: item.name, text: item.label })));
const group = computed(() => groups.value.find(item => item.name === selected.value));
const fields = computed(() =>
  group.value?.fields.filter(
    field =>
      (field.key !== 'usersCanChange' || draft.value?.twoFactorBehaviour === 0) &&
      (selected.value !== 'captcha' ||
        ((!isTenant.value ||
          ![
            'verifyBaseUrl',
            'useCaptchaOnLogin',
            'useCaptchaOnRegistration',
            'useCaptchaOnForgotPassword',
          ].includes(field.key)) &&
          (field.key !== 'score' || draft.value?.version === 3))),
  ),
);
const externalProviders = computed(() =>
  selected.value === 'external' && Array.isArray(draft.value?.externalProviders)
    ? (draft.value.externalProviders as ExternalProviderSettings[]).filter(
        provider => !isTenant.value || provider.enabledForTenantUser,
      )
    : [],
);
function providerPropertyLabel(
  provider: string | null | undefined,
  property: string | null | undefined,
): string {
  const key = localization.findKey([], [`ExternalProvider:${provider}:${property}`]);
  return key ? localization.t(key) : (property ?? '');
}

function invalidate(): void {
  revision += 1;
  controller.abort();
  controller = new AbortController();
  busy.value = false;
  draft.value = undefined;
  baseline = {};
}

async function load(): Promise<void> {
  invalidate();
  if (!allowed.value) return;
  const own = revision;
  busy.value = true;
  failed.value = false;
  try {
    if (isTenant.value) {
      const [captcha, external] = await Promise.all([
        service.getRecaptcha({ signal: controller.signal }),
        service.getExternalProvider({ signal: controller.signal }),
      ]);
      if (own !== revision) return;
      tenantCapabilities.value = {
        captcha: Boolean(captcha.useCaptchaOnLogin || captcha.useCaptchaOnRegistration),
        external: Boolean(
          external.externalProviders?.some(provider => provider.enabledForTenantUser),
        ),
      };
    }
    if (!group.value) {
      selected.value = 'general';
      return;
    }
    const result = await sections[selected.value].get({ signal: controller.signal });
    if (own !== revision) return;
    baseline = structuredClone(result) as unknown as Record<string, unknown>;
    draft.value = structuredClone(baseline);
    needsReload.value = false;
  } catch {
    // The transport reports the failure; retain an explicit reload action.
    if (own === revision) failed.value = true;
  } finally {
    if (own === revision) busy.value = false;
  }
}

async function save(): Promise<void> {
  if (busy.value || !draft.value || !allowed.value || needsReload.value || !group.value) return;
  const section = selected.value;
  const edited = structuredClone(toRaw(draft.value));
  const own = revision;
  busy.value = true;
  failed.value = false;
  try {
    const fresh = await sections[section].get({ signal: controller.signal });
    if (own !== revision || !allowed.value) return;
    const body = applySettingChanges(
      fresh,
      baseline,
      edited,
    ) as AccountAdminSettings[typeof section];
    await sections[section].update(body, { signal: controller.signal });
    needsReload.value = true;
    await config.refreshAppState();
    if (own !== revision) return;
    baseline = structuredClone(body) as unknown as Record<string, unknown>;
    draft.value = structuredClone(baseline);
    needsReload.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
  } catch {
    // A refused or interrupted write may have committed; read before another save.
    if (own === revision) {
      failed.value = true;
      needsReload.value = true;
    }
  } finally {
    if (own === revision) busy.value = false;
  }
}

watch(
  [
    selected,
    allowed,
    () => config.snapshot().currentTenant.id,
    () => config.snapshot().currentUser.id,
  ],
  load,
  { immediate: true },
);
onScopeDispose(invalidate);
</script>
