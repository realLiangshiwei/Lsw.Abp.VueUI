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
  AbpSelect,
  AbpToggle,
  useAbpForm,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { AUTHENTICATOR_CODE, TWO_FACTOR_TEXTS } from '../defaults/texts.js';
import { TwoFactorService, type TwoFactorProvider } from '../services/two-factor.service.js';
import { redirectUrlOf } from '../utils/redirect-url.js';

const auth = injectAbp(AuthService);
const wrapper = useAuthWrapper();
const localization = useLocalization();
const toaster = useToaster();
const route = useRoute();
const injector = getCurrentInjector();
const messagesOf = useValidationMessages();
const twoFactor = injectAbp(TwoFactorService);

const form = useAbpForm({
  username: { value: '', validators: [Validators.required(), Validators.maxLength(255)] },
  password: { value: '', validators: [Validators.required(), Validators.maxLength(128)] },
  rememberMe: { value: false },
  twoFactorCode: { value: '' },
});

const busy = ref(false);
const challenge = shallowRef<TwoFactorRequiredError>();
const providers = shallowRef<readonly TwoFactorProvider[]>([]);
const provider = ref('');
const sending = ref(false);
const codeSent = ref(false);
const secondFactor = computed(() => challenge.value !== undefined);
const selectedProvider = computed(() => providers.value.find(item => item.name === provider.value));
const providerOptions = computed(() =>
  providers.value.map(item => ({
    value: item.name,
    label: item.displayName ?? item.name,
  })),
);

watch(provider, () => {
  codeSent.value = false;
  form.controls.twoFactorCode.reset('');
});

function startOver(): void {
  challenge.value = undefined;
  providers.value = [];
  provider.value = '';
  form.controls.twoFactorCode.reset('');
}

async function sendCode(): Promise<void> {
  if (!challenge.value || !selectedProvider.value || sending.value) return;
  sending.value = true;
  const selected = provider.value;
  try {
    await twoFactor.sendCode(challenge.value, selected);
    if (selected === provider.value) codeSent.value = true;
  } catch (error) {
    toaster.error(describe(error));
  } finally {
    sending.value = false;
  }
}

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
  if (busy.value || sending.value) return;
  if (!form.validate()) return;
  if (secondFactor.value && (!selectedProvider.value || !form.value.twoFactorCode.trim())) {
    toaster.error(localization.t(TWO_FACTOR_TEXTS.required));
    return;
  }
  if (selectedProvider.value?.requiresCodeDelivery && !codeSent.value) {
    await sendCode();
    return;
  }

  busy.value = true;

  try {
    await auth.login({
      username: form.value.username,
      password: form.value.password,
      rememberMe: form.value.rememberMe,
      redirectUrl: injector ? redirectUrlOf(injector, route) : '/',
      ...(secondFactor.value
        ? { twoFactorProvider: provider.value, twoFactorCode: form.value.twoFactorCode.trim() }
        : {}),
    });
  } catch (error) {
    if (error instanceof TwoFactorRequiredError) {
      try {
        const available = await twoFactor.getProviders(error);
        if (available.length === 0) {
          toaster.error(localization.t(TWO_FACTOR_TEXTS.unavailable));
          return;
        }
        challenge.value = error;
        providers.value = available;
        if (!available.some(item => item.name === provider.value))
          provider.value = available[0]?.name ?? '';
      } catch (failure) {
        toaster.error(describe(failure));
      }
    } else toaster.error(describe(error), undefined, { life: 7000 });
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
          :disabled="busy"
          :readonly="secondFactor"
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
          :disabled="busy"
          :readonly="secondFactor"
          revealable
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.password.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpFormField
      v-if="secondFactor && providers.length > 1"
      :label="localization.t(TWO_FACTOR_TEXTS.provider)"
    >
      <template #default="{ id }">
        <AbpSelect
          :id="id"
          v-model="provider"
          :options="providerOptions"
          :disabled="busy || sending"
          name="twoFactorProvider"
        />
      </template>
    </AbpFormField>

    <div v-if="secondFactor && selectedProvider?.requiresCodeDelivery" class="mb-3">
      <AbpButton variant="secondary" :loading="sending" :disabled="busy" @click="sendCode">
        {{ localization.t(codeSent ? TWO_FACTOR_TEXTS.resend : TWO_FACTOR_TEXTS.send) }}
      </AbpButton>
      <p v-if="codeSent" class="small text-body-secondary mt-2 mb-0" role="status">
        {{ localization.t(TWO_FACTOR_TEXTS.sent) }}
      </p>
    </div>

    <AbpFormField
      v-if="secondFactor"
      :label="
        localization.t(provider === 'Authenticator' ? AUTHENTICATOR_CODE : TWO_FACTOR_TEXTS.code)
      "
      required
    >
      <template #default="{ id }">
        <AbpInput
          :id="id"
          v-model="form.controls.twoFactorCode.value"
          name="twoFactorCode"
          autocomplete="one-time-code"
          :disabled="busy || sending"
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

    <AbpButton type="submit" variant="primary" block :loading="busy" :disabled="sending">
      {{ $t('AbpAccount::Login') }}
    </AbpButton>
    <AbpButton
      v-if="secondFactor"
      variant="link"
      block
      :disabled="busy || sending"
      @click="startOver"
    >
      {{ localization.t(TWO_FACTOR_TEXTS.back) }}
    </AbpButton>
  </form>
</template>
