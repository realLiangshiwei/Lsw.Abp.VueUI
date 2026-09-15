<script setup lang="ts">
import { useAuthWrapper } from '@lsw-abpvue/account-core';
import {
  AuthError,
  AuthService,
  getCurrentInjector,
  inject as injectAbp,
  TwoFactorRequiredError,
  useLocalization,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpToggle,
  useAbpForm,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { AUTHENTICATOR_CODE } from '../defaults/texts.js';
import { redirectUrlOf } from '../utils/redirect-url.js';

const auth = injectAbp(AuthService);
const wrapper = useAuthWrapper();
const localization = useLocalization();
const toaster = useToaster();
const route = useRoute();
const injector = getCurrentInjector();
const messagesOf = useValidationMessages();

const form = useAbpForm({
  username: { value: '', validators: [Validators.required(), Validators.maxLength(255)] },
  password: { value: '', validators: [Validators.required(), Validators.maxLength(128)] },
  rememberMe: { value: false },
  twoFactorCode: { value: '' },
});

const busy = ref(false);
/** ABP asked for the code from the authenticator app; the credentials were right. */
const secondFactor = ref(false);

const errorsOf = (name: 'username' | 'password') =>
  computed(() => (form.controls[name].touched ? messagesOf(form.controls[name].errors) : []));

const usernameErrors = errorsOf('username');
const passwordErrors = errorsOf('password');

/**
 * ABP answers a refused grant with an OAuth error code and an English description. The
 * code is what is worth translating; the description is the backend's own words and is
 * shown when there is nothing better.
 */
function describe(error: unknown): string {
  if (error instanceof AuthError) {
    return error.error === 'invalid_grant' && !error.errorDescription
      ? localization.t('AbpAccount::InvalidUserNameOrPassword')
      : (error.errorDescription ?? localization.t('AbpAccount::InvalidUserNameOrPassword'));
  }

  return error instanceof Error ? error.message : String(error);
}

async function submit(): Promise<void> {
  if (!form.validate()) return;

  busy.value = true;

  try {
    await auth.login({
      username: form.value.username,
      password: form.value.password,
      rememberMe: form.value.rememberMe,
      redirectUrl: injector ? redirectUrlOf(injector, route) : '/',
      ...(secondFactor.value
        ? { twoFactorProvider: 'Authenticator', twoFactorCode: form.value.twoFactorCode }
        : {}),
    });
  } catch (error) {
    if (error instanceof TwoFactorRequiredError) secondFactor.value = true;
    else toaster.error(describe(error), undefined, { life: 7000 });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h1 class="h4 mb-3">{{ $t('AbpAccount::Login') }}</h1>

  <p v-if="wrapper.isSelfRegistrationEnabled.value">
    <strong>{{ $t('AbpAccount::AreYouANewUser') }}</strong>
    <RouterLink class="ms-1" to="/account/register">{{ $t('AbpAccount::Register') }}</RouterLink>
  </p>

  <form novalidate @submit.prevent="submit">
    <AbpFormField
      :label="localization.t('AbpAccount::UserNameOrEmailAddress')"
      required
      :errors="usernameErrors"
    >
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.username.value"
          name="username"
          autocomplete="username"
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.username.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpFormField :label="localization.t('AbpAccount::Password')" required :errors="passwordErrors">
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.password.value"
          type="password"
          name="password"
          autocomplete="current-password"
          revealable
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.password.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpFormField v-if="secondFactor" :label="localization.t(AUTHENTICATOR_CODE)">
      <template #default="{ id }">
        <AbpInput
          :id="id"
          v-model="form.controls.twoFactorCode.value"
          name="twoFactorCode"
          autocomplete="one-time-code"
        />
      </template>
    </AbpFormField>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <AbpToggle
        v-model="form.controls.rememberMe.value"
        name="rememberMe"
        :label="localization.t('AbpAccount::RememberMe')"
      />
      <RouterLink to="/account/forgot-password">
        {{ $t('AbpAccount::ForgotPassword') }}
      </RouterLink>
    </div>

    <AbpButton type="submit" variant="primary" block :loading="busy">
      {{ $t('AbpAccount::Login') }}
    </AbpButton>
  </form>
</template>
