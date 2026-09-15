<script setup lang="ts">
import { useAuthWrapper } from '@lsw-abpvue/account-core';
import { AccountService } from '@lsw-abpvue/account-core/proxy';
import {
  AuthService,
  getCurrentInjector,
  inject as injectAbp,
  useLocalization,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  usePasswordValidators,
  useServerValidation,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ACCOUNT_APP_NAME } from '../tokens/config-options.token.js';
import { redirectUrlOf } from '../utils/redirect-url.js';

const account = injectAbp(AccountService);
const auth = injectAbp(AuthService);
const appName = injectAbp(ACCOUNT_APP_NAME);
const wrapper = useAuthWrapper();
const localization = useLocalization();
const toaster = useToaster();
const route = useRoute();
const injector = getCurrentInjector();
const messagesOf = useValidationMessages();

const form = useAbpForm({
  userName: { value: '', validators: [Validators.required(), Validators.maxLength(255)] },
  emailAddress: { value: '', validators: [Validators.required(), Validators.email()] },
  password: { value: '', validators: [Validators.required(), ...usePasswordValidators()] },
});

useServerValidation(form);

const busy = ref(false);

const errorsOf = (name: 'userName' | 'emailAddress' | 'password') =>
  computed(() => (form.controls[name].touched ? messagesOf(form.controls[name].errors) : []));

const userNameErrors = errorsOf('userName');
const emailErrors = errorsOf('emailAddress');
const passwordErrors = errorsOf('password');

// The page is reachable when the setting is off -- a link, a bookmark -- and saying so
// is better than a form whose every submission the server refuses.
onMounted(() => {
  if (!wrapper.isSelfRegistrationEnabled.value) {
    toaster.warn('AbpAccount::SelfRegistrationDisabledMessage', undefined, { life: 10000 });
  }
});

async function submit(): Promise<void> {
  if (!form.validate() || !wrapper.isSelfRegistrationEnabled.value) return;

  busy.value = true;

  try {
    await account.register({ ...form.value, appName });
    // Straight in: the account exists and the password is the one just typed.
    await auth.login({
      username: form.value.userName,
      password: form.value.password,
      redirectUrl: injector ? redirectUrlOf(injector, route) : '/',
    });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h1 class="h4 mb-3">{{ $t('AbpAccount::Register') }}</h1>

  <p>
    <strong>{{ $t('AbpAccount::AlreadyRegistered') }}</strong>
    <RouterLink class="ms-1" to="/account/login">{{ $t('AbpAccount::Login') }}</RouterLink>
  </p>

  <form novalidate @submit.prevent="submit">
    <AbpFormField :label="localization.t('AbpAccount::UserName')" required :errors="userNameErrors">
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.userName.value"
          name="userName"
          autocomplete="username"
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.userName.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpFormField
      :label="localization.t('AbpAccount::EmailAddress')"
      required
      :errors="emailErrors"
    >
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.emailAddress.value"
          type="email"
          name="emailAddress"
          autocomplete="email"
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.emailAddress.markAsTouched()"
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
          autocomplete="new-password"
          revealable
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.password.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpButton
      type="submit"
      variant="primary"
      block
      :loading="busy"
      :disabled="!wrapper.isSelfRegistrationEnabled.value"
    >
      {{ $t('AbpAccount::Register') }}
    </AbpButton>
  </form>
</template>
