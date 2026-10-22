<template>
  <section v-if="allowed" :aria-label="localization.t('AbpIdentity::Menu:IdentityManagement')">
    <AbpTabList
      :model-value="tab"
      :items="tabs"
      :aria-label="localization.t('AbpIdentity::Menu:IdentityManagement')"
      @update:model-value="selectTab"
    />
    <AbpSpinner v-if="loading" />
    <div v-else-if="readFailed" role="alert">
      <p>{{ loadFailure }}</p>
      <AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <form
      v-else-if="ready"
      novalidate
      :aria-label="localization.t(activeTitle)"
      @submit.prevent="save"
    >
      <fieldset :disabled="busy || failed">
        <legend>{{ localization.t(activeTitle) }}</legend>
        <template v-if="tab === 'session'">
          <AbpFormField
            v-slot="control"
            :label="localization.t('AbpIdentity::DisplayName:Abp.Identity.PreventConcurrentLogin')"
            :errors="errors.preventConcurrentLogin ? [invalidValue] : []"
          >
            <AbpSelect
              :id="control.id"
              :model-value="draft.preventConcurrentLogin"
              name="preventConcurrentLogin"
              :options="sessionOptions"
              :invalid="control.invalid"
              :aria-describedby="control.describedBy"
              @update:model-value="
                draft.preventConcurrentLogin = typeof $event === 'number' ? $event : undefined
              "
            />
          </AbpFormField>
          <p>
            {{ localization.t('AbpIdentity::Description:Abp.Identity.PreventConcurrentLogin') }}
          </p>
          <dl>
            <template v-for="option in sessionOptions" :key="option.value">
              <dt>{{ option.label }}</dt>
              <dd>
                {{
                  localization.t(
                    `AbpIdentity::Description:IdentityProPreventConcurrentLoginBehaviour.${sessionNames[option.value]}`,
                  )
                }}
              </dd>
            </template>
          </dl>
        </template>
        <template v-else>
          <AbpFormField
            v-for="field in fields"
            :key="field.name"
            v-slot="control"
            :label="localization.t(field.label)"
            :required="field.required"
            :errors="errors[field.name] ? [invalidValue] : []"
          >
            <AbpToggle
              v-if="field.type === 'boolean'"
              :id="control.id"
              :model-value="draft[field.name] === true"
              :name="field.name"
              @update:model-value="draft[field.name] = $event === true"
            />
            <AbpInput
              v-else
              :id="control.id"
              :model-value="scalar(field.name)"
              :type="field.type"
              :name="field.name"
              :min="field.min"
              :max="field.max"
              :step="field.type === 'number' ? 1 : undefined"
              :autocomplete="field.type === 'password' ? 'new-password' : undefined"
              :placeholder="field.type === 'password' ? secretPlaceholder : undefined"
              :disabled="field.name === 'clientSecret' && draft.clearClientSecret === true"
              :invalid="control.invalid"
              :aria-describedby="control.describedBy"
              @update:model-value="draft[field.name] = $event ?? undefined"
            />
            <small v-if="description(field)" class="form-text">{{
              localization.t(description(field))
            }}</small>
          </AbpFormField>
        </template>
        <AbpToggle
          v-if="tab === 'oauth'"
          :model-value="draft.clearClientSecret === true"
          name="clearClientSecret"
          :disabled="busy || failed"
          :label="`${localization.t('AbpUi::Clear')}: ${localization.t('AbpIdentity::DisplayName:Abp.Identity.ClientSecret')}`"
          @update:model-value="draft.clearClientSecret = $event === true"
        />
      </fieldset>
      <div v-if="failed" role="alert">
        <p>{{ saveFailure }}</p>
        <AbpButton variant="secondary" :disabled="busy" @click="reloadAfterFailure">{{
          localization.t('AbpUi::Refresh')
        }}</AbpButton>
      </div>
      <AbpButton variant="primary" type="submit" :loading="busy" :disabled="failed || !ready">{{
        localization.t('AbpUi::Save')
      }}</AbpButton>
    </form>
  </section>
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
  IdentitySettingsService,
  type IdentitySettingsDto,
  type IdentityLdapSettingsDto,
  type IdentityOAuthSettingsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { IDENTITY_SETTINGS_FIELDS } from '../defaults/identity-settings.js';
import type {
  IdentitySettingsField,
  IdentitySettingsScalar,
  IdentitySettingsTab,
} from '../models/identity-settings.js';
import {
  mergeIdentitySettingsGroup,
  serializeIdentityLdapSettings,
  serializeIdentityOAuthSettings,
} from '../utils/identity-settings.js';

const settings = injectAbp(IdentitySettingsService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const confirmation = useConfirmation();
const tab = ref<IdentitySettingsTab>('password');
const draft = reactive<Record<string, IdentitySettingsScalar>>({});
const errors = ref<Record<string, boolean>>({});
let baseline: Record<string, IdentitySettingsScalar> = {};
const loading = ref(false);
const busy = ref(false);
const ready = ref(false);
const readFailed = ref(false);
const failed = ref(false);
let revision = 0;
let pending: AbortController | undefined;
const allowed = computed(
  () =>
    permission.isGranted('AbpIdentity.SettingManagement') &&
    (config.snapshot().multiTenancy.userSharingStrategy !== 1 ||
      !config.snapshot().currentTenant.id),
);
const feature = (name: string) => config.snapshot().features.values[name]?.toLowerCase() === 'true';
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    allowed.value,
    feature('Account.EnableLdapLogin'),
    feature('Identity.EnableOAuthLogin'),
  ]),
);
const titles: Record<IdentitySettingsTab, string> = {
  password: 'AbpIdentity::IdentitySettingsPasswordPolicy',
  lockout: 'AbpIdentity::IdentitySettingsLockout',
  signIn: 'AbpIdentity::IdentitySettingsIdentityVerification',
  user: 'AbpIdentity::IdentitySettingsUserProfile',
  session: 'AbpIdentity::Sessions',
  ldap: 'AbpIdentity::IdentitySettingsLdap',
  oauth: 'AbpIdentity::IdentitySettingsOAuth',
};
const tabs = computed(() =>
  (Object.keys(titles) as IdentitySettingsTab[])
    .filter(
      name =>
        (name !== 'ldap' && name !== 'oauth') ||
        (name === 'ldap' && feature('Account.EnableLdapLogin')) ||
        (name === 'oauth' && feature('Identity.EnableOAuthLogin')),
    )
    .map(name => ({ name, text: titles[name], disabled: busy.value })),
);
const activeTitle = computed(() => titles[tab.value]);
const fields = computed(() => (tab.value === 'session' ? [] : IDENTITY_SETTINGS_FIELDS[tab.value]));
const sessionNames = ['Disabled', 'LogoutFromSameTypeDevices', 'LogoutFromAllDevices'];
const sessionOptions = computed(() =>
  sessionNames.map((name, value) => ({
    value,
    label: localization.t(`AbpIdentity::Enum:IdentityProPreventConcurrentLoginBehaviour.${name}`),
  })),
);
const loadFailure = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const saveFailure = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const invalidValue = computed(() => localization.t('AbpValidation::ThisFieldIsNotValid.'));
const secretPlaceholder = computed(() => localization.t('AbpAccount::EnterAValueToUpdateSecret'));
function selectTab(value: string): void {
  if (!busy.value && tabs.value.some(item => item.name === value))
    tab.value = value as IdentitySettingsTab;
}

function scalar(name: string): string | number | undefined {
  const value = draft[name];
  return typeof value === 'boolean' ? String(value) : value;
}
function description(field: IdentitySettingsField): string {
  return field.label.includes('Abp.Identity.Password.') ||
    field.label.includes('Abp.Identity.Lockout.') ||
    field.label.includes('Abp.Identity.SignIn.') ||
    field.label.includes('Abp.Identity.User.')
    ? field.label.replace('DisplayName:', 'Description:')
    : '';
}
function reset(): void {
  revision += 1;
  pending?.abort();
  pending = undefined;
  loading.value = false;
  busy.value = false;
  ready.value = false;
  failed.value = false;
  readFailed.value = false;
  errors.value = {};
  baseline = {};
  for (const key of Object.keys(draft)) delete draft[key];
}
async function load(): Promise<void> {
  reset();
  if (!allowed.value || !tabs.value.some(item => item.name === tab.value)) return;
  const own = revision;
  pending = new AbortController();
  const signal = pending.signal;
  const options = { signal, skipHandleError: true };
  loading.value = true;
  try {
    const name = tab.value;
    const value =
      name === 'ldap'
        ? await settings.getLdap(options)
        : name === 'oauth'
          ? await settings.getOAuth(options)
          : name === 'session'
            ? await settings.getSession(options)
            : await settings.get(options);
    if (own !== revision || signal.aborted) return;
    const group =
      name === 'ldap' || name === 'oauth' || name === 'session'
        ? value
        : (value as IdentitySettingsDto)[name];
    if (!group) throw new TypeError('The settings group is unavailable.');
    for (const [key, value] of Object.entries(group))
      if (['string', 'number', 'boolean'].includes(typeof value))
        draft[key] = value as IdentitySettingsScalar;
    // Secret reads never become editable values or implicit writes.
    delete draft.ldapPassword;
    delete draft.clientSecret;
    if (name === 'oauth') draft.clearClientSecret = false;
    baseline = { ...draft };
    ready.value = true;
  } catch {
    if (own === revision && !signal.aborted) readFailed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}
function validate(): boolean {
  const invalid: Record<string, boolean> = {};
  for (const field of fields.value) {
    const value = draft[field.name];
    if (field.required && (value === undefined || value === '')) invalid[field.name] = true;
    if (
      field.type === 'number' &&
      (typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max))
    )
      invalid[field.name] = true;
  }
  if (tab.value === 'session' && ![0, 1, 2].includes(Number(draft.preventConcurrentLogin)))
    invalid.preventConcurrentLogin = true;
  errors.value = invalid;
  return Object.keys(invalid).length === 0;
}
async function save(): Promise<void> {
  if (!allowed.value || busy.value || !ready.value || failed.value || !validate()) return;
  const own = revision;
  const name = tab.value;
  const changes = Object.fromEntries(
    Object.entries(draft).filter(([name, value]) => value !== baseline[name]),
  );
  const controller = new AbortController();
  pending = controller;
  const options = { signal: controller.signal, skipHandleError: true };
  busy.value = true;
  try {
    if (name === 'session')
      await settings.updateSession(
        { preventConcurrentLogin: Number(draft.preventConcurrentLogin) as 0 | 1 | 2 },
        options,
      );
    else {
      const fresh =
        name === 'ldap'
          ? await settings.getLdap(options)
          : name === 'oauth'
            ? await settings.getOAuth(options)
            : await settings.get(options);
      if (own !== revision || controller.signal.aborted || !allowed.value) return;
      if (name === 'ldap')
        await settings.updateLdap(
          serializeIdentityLdapSettings(fresh as IdentityLdapSettingsDto, changes),
          options,
        );
      else if (name === 'oauth')
        await settings.updateOAuth(
          serializeIdentityOAuthSettings(fresh as IdentityOAuthSettingsDto, changes),
          options,
        );
      else
        await settings.update(
          mergeIdentitySettingsGroup(fresh as IdentitySettingsDto, name, changes),
          options,
        );
    }
    if (own !== revision || controller.signal.aborted) return;
    await config.refreshAppState();
    if (own !== revision || controller.signal.aborted) return;
    toaster.success('AbpUi::SavedSuccessfully');
    await load();
  } catch {
    if (own === revision && !controller.signal.aborted) failed.value = true;
  } finally {
    if (own === revision) busy.value = false;
  }
}
async function reloadAfterFailure(): Promise<void> {
  if (!failed.value || busy.value) return;
  const own = revision;
  busy.value = true;
  try {
    const answer = await confirmation.warn(saveFailure.value, 'AbpUi::AreYouSure');
    if (answer === ConfirmationStatus.confirm && own === revision) await load();
  } finally {
    if (own === revision) busy.value = false;
  }
}
watch(
  [tab, context],
  () => {
    if (!tabs.value.some(item => item.name === tab.value)) tab.value = 'password';
    void load();
  },
  { immediate: true, flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
