<script setup lang="ts">
import {
  AuthError,
  AuthService,
  inject,
  TwoFactorRequiredError,
  useLocalization,
} from '@lsw-abpvue/core';
import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

const auth = inject(AuthService);
const localization = useLocalization();
const route = useRoute();

const form = reactive({ username: '', password: '', rememberMe: false, twoFactorCode: '' });
const secondFactor = ref(false);
const failure = ref<string | null>(null);
const busy = ref(false);

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

async function submit() {
  failure.value = null;
  busy.value = true;

  try {
    await auth.login({
      username: form.username,
      password: form.password,
      rememberMe: form.rememberMe,
      redirectUrl: typeof route.query.returnUrl === 'string' ? route.query.returnUrl : '/',
      ...(secondFactor.value
        ? { twoFactorProvider: 'Authenticator', twoFactorCode: form.twoFactorCode }
        : {}),
    });
  } catch (error) {
    // The credentials were right; ABP is asking for the code from the authenticator app.
    if (error instanceof TwoFactorRequiredError) secondFactor.value = true;
    else failure.value = describe(error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h2>{{ $t('AbpAccount::Login') }}</h2>

  <form @submit.prevent="submit">
    <label>
      {{ $t('AbpAccount::UserNameOrEmailAddress') }}
      <input v-model="form.username" name="username" autocomplete="username" required />
    </label>

    <label>
      {{ $t('AbpAccount::Password') }}
      <input
        v-model="form.password"
        type="password"
        name="password"
        autocomplete="current-password"
        required
      />
    </label>

    <label v-if="secondFactor">
      {{ $t('AbpAccount::AuthenticatorCode') }}
      <input v-model="form.twoFactorCode" name="twoFactorCode" autocomplete="one-time-code" />
    </label>

    <label class="hint">
      <input v-model="form.rememberMe" type="checkbox" />
      {{ $t('AbpAccount::RememberMe') }}
    </label>

    <p v-if="failure" class="error" role="alert">{{ failure }}</p>

    <button type="submit" :disabled="busy">{{ $t('AbpAccount::Login') }}</button>
  </form>
</template>
