<template>
  <div>
    <p v-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton v-if="failed" :disabled="busy" @click="reload">{{ $t('AbpUi::Refresh') }}</AbpButton>
    <form v-if="form" @submit.prevent="save">
      <fieldset :disabled="busy || needsReload">
        <AbpExtensibleForm :form="form" :record="profile ?? undefined" />
        <AbpButton type="submit" :loading="busy">{{ $t('AbpUi::Save') }}</AbpButton>
      </fieldset>
    </form>
    <section v-if="profile" class="mt-3">
      <h2 class="h5">{{ $t('AbpIdentity::DisplayName:Email') }}</h2>
      <p>
        {{ profile.email }} ·
        {{ $t(profile.emailConfirmed ? 'AbpAccount::Verified' : 'AbpAccount::NotVerified') }}
      </p>
      <AbpButton
        v-if="!profile.emailConfirmed"
        :disabled="busy || needsReload || !emailSaved"
        @click="sendEmail"
        >{{ $t('AbpAccount::Verify') }}</AbpButton
      >
      <p v-if="emailSent" role="status">
        {{ $t('AbpAccount::EmailConfirmationSentMessage', profile.email ?? '') }}
      </p>
      <h2 class="h5 mt-3">{{ $t('AbpIdentity::DisplayName:PhoneNumber') }}</h2>
      <p>
        {{ profile.phoneNumber }} ·
        {{ $t(profile.phoneNumberConfirmed ? 'AbpAccount::Verified' : 'AbpAccount::NotVerified') }}
      </p>
      <template
        v-if="phoneConfirmationEnabled && !profile.phoneNumberConfirmed && profile.phoneNumber"
      >
        <AbpButton :disabled="busy || needsReload || !phoneSaved" @click="sendPhone">{{
          $t('AbpAccount::Verify')
        }}</AbpButton>
        <form v-if="phoneSent" @submit.prevent="confirmPhone">
          <AbpFormField v-slot="field" :label="$t('AbpAccount::PhoneConfirmationToken')" required
            ><AbpInput
              :id="field.id"
              v-model="code"
              name="phoneConfirmationToken"
              autocomplete="one-time-code"
              required
          /></AbpFormField>
          <AbpButton type="submit" :disabled="busy || !code.trim() || needsReload">{{
            $t('AbpAccount::Verify')
          }}</AbpButton>
        </form>
      </template>
    </section>
  </div>
</template>
<script setup lang="ts">
import { AccountProProfileStateService, ACCOUNT_PRO_OPTIONS } from '@lsw-abpvue/account-pro/config';
import {
  AccountService,
  ProfileService,
  type ProfileDto,
  type UpdateProfileDto,
} from '@lsw-abpvue/account-pro/proxy';
import {
  AbpExtensibleForm,
  EXTENSIONS_IDENTIFIER,
  useExtensibleForm,
  type ExtensibleForm,
} from '@lsw-abpvue/components';
import {
  AuthService,
  ConfigStateService,
  inject as injectAbp,
  provideAbp,
  runInInjectionContext,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, shallowRef } from 'vue';
import { AccountProComponents } from '../enums/components.js';
import { useAccountOperation } from '../utils/use-account-operation.js';
import { ACCOUNT_PRO_CONFIG_OPTIONS } from '../tokens/config-options.token.js';

const profiles = injectAbp(ProfileService);
const account = injectAbp(AccountService);
const state = injectAbp(AccountProProfileStateService);
const config = injectAbp(ConfigStateService);
const auth = injectAbp(AuthService, { optional: true });
const options = { ...injectAbp(ACCOUNT_PRO_OPTIONS), ...injectAbp(ACCOUNT_PRO_CONFIG_OPTIONS) };
const toaster = useToaster();
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: AccountProComponents.PersonalSettings },
]);
const profile = state.profile;
const form = shallowRef<ExtensibleForm<ProfileDto>>();
const { busy, failed, needsReload, run } = useAccountOperation();
const emailSent = ref(false);
const phoneSent = ref(false);
const code = ref('');
let poll: ReturnType<typeof setInterval> | undefined;
const emailSaved = computed(() => form.value?.form.value.email === profile.value?.email);
const phoneSaved = computed(
  () => form.value?.form.value.phoneNumber === profile.value?.phoneNumber,
);
const phoneConfirmationEnabled = computed(
  () =>
    config
      .snapshot()
      .setting.values['Abp.Identity.SignIn.EnablePhoneNumberConfirmation']?.toLowerCase() ===
    'true',
);
function build(): void {
  if (profile.value)
    form.value = runInInjectionContext(injector, () =>
      useExtensibleForm<ProfileDto>(profile.value ?? undefined),
    );
}
build();
useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });
function reload(): Promise<boolean> {
  return run(
    signal => profiles.get({ signal }),
    value => {
      state.set(value, state.canEnableTwoFactor.value);
      build();
    },
  );
}
async function save(): Promise<void> {
  if (!form.value?.form.validate() || !profile.value) return;
  const previous = profile.value;
  const values = form.value.toRequestBody() as Partial<UpdateProfileDto>;
  await run(
    async signal => {
      const saved = await profiles.update(
        {
          ...values,
          userName: values.userName ?? previous.userName ?? '',
          email: values.email ?? previous.email,
          concurrencyStamp: previous.concurrencyStamp,
          extraProperties: { ...previous.extraProperties, ...values.extraProperties },
          appName: options.appName ?? 'Vue',
        },
        { signal },
      );
      await config.refreshAppState();
      if (auth?.isAuthenticated.value) await auth.refreshToken();
      return saved;
    },
    saved => {
      state.set(saved, state.canEnableTwoFactor.value);
      build();
      toaster.success('AbpAccount::PersonalSettingsSaved');
    },
    true,
  );
}
async function sendEmail(): Promise<void> {
  const userId = config.snapshot().currentUser.id;
  if (!userId || !emailSaved.value) return;
  const sent = await run(
    signal =>
      account.sendEmailConfirmationToken({ userId, appName: options.appName ?? 'Vue' }, { signal }),
    () => {
      emailSent.value = true;
    },
    true,
  );
  if (sent && !poll)
    poll = setInterval(() => {
      void run(
        signal => account.getConfirmationState(userId, { signal }),
        value => {
          if (profile.value)
            state.set({ ...profile.value, ...value }, state.canEnableTwoFactor.value);
          if (value.emailConfirmed && poll) {
            clearInterval(poll);
            poll = undefined;
          }
        },
      );
    }, 3000);
}
async function sendPhone(): Promise<void> {
  const userId = config.snapshot().currentUser.id;
  if (!userId || !phoneSaved.value || !phoneConfirmationEnabled.value) return;
  await run(
    signal =>
      account.sendPhoneNumberConfirmationToken(
        { userId, phoneNumber: profile.value?.phoneNumber },
        { signal },
      ),
    () => {
      phoneSent.value = true;
    },
    true,
  );
}
async function confirmPhone(): Promise<void> {
  const userId = config.snapshot().currentUser.id;
  if (!userId || !code.value.trim() || !phoneConfirmationEnabled.value) return;
  await run(
    async signal => {
      await account.confirmPhoneNumber({ userId, token: code.value }, { signal });
      return profiles.get({ signal });
    },
    value => {
      state.set(value, state.canEnableTwoFactor.value);
      code.value = '';
      phoneSent.value = false;
    },
    true,
  );
}
onScopeDispose(() => {
  if (poll) clearInterval(poll);
  code.value = '';
});
</script>
