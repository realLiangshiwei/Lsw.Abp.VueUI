<template>
  <div>
    <h1 class="h4">{{ $t(title) }}</h1>
    <p v-if="failed" role="alert">{{ $t('AbpAccount::DefaultErrorMessage') }}</p>
    <p v-if="done" role="status">
      {{
        $t(
          mode === 'forgot-password'
            ? 'AbpAccount::PasswordResetMailSentMessage'
            : 'AbpAccount::YourPasswordIsSuccessfullyReset',
        )
      }}
    </p>
    <p v-else-if="!available && !busy" role="alert">
      {{
        $t(
          mode === 'register'
            ? 'AbpAccount::SelfRegistrationDisabledMessage'
            : 'AbpUi::ValidationErrorMessage',
        )
      }}
    </p>
    <template v-else-if="available">
      <p v-if="mode === 'recovery-code'">
        {{ $t('AbpAccount::LoginWithRecoveryCode_Information') }}
      </p>
      <form novalidate @submit.prevent="submit">
        <fieldset :disabled="busy || needsReload">
          <AbpFormField
            v-if="mode === 'two-factor'"
            v-slot="control"
            :label="$t('AbpAccount::SelectedProvider')"
            required
          >
            <AbpSelect
              :id="control.id"
              v-model="provider"
              :options="providers.map(value => ({ value, label: value }))"
            />
          </AbpFormField>
          <template v-for="field in fields" :key="field.name">
            <AbpFormField
              v-slot="control"
              :label="$t(field.label)"
              :errors="
                form.controls[field.name].touched ? messages(form.controls[field.name].errors) : []
              "
              required
            >
              <AbpInput
                :id="control.id"
                v-model="form.controls[field.name].value"
                :name="field.name"
                :type="field.type"
                :autocomplete="field.autocomplete"
                :invalid="control.invalid"
                :aria-describedby="control.describedBy"
                :revealable="field.type === 'password'"
                @blur="form.controls[field.name].markAsTouched()"
                @keydown="capsLock = $event.getModifierState?.('CapsLock') ?? false"
              />
            </AbpFormField>
          </template>
          <p v-if="capsLock" role="status">{{ $t('AbpAccount::CapsLockOn') }}</p>
          <PasswordStrength
            v-if="['register', 'reset-password', 'change-password'].includes(mode)"
            :password="form.controls.password.value"
          />
          <AbpToggle
            v-if="mode === 'login'"
            v-model="rememberMe"
            :label="$t('AbpAccount::RememberMe')"
          />
          <AbpToggle
            v-if="mode === 'two-factor' && rememberBrowserEnabled"
            v-model="rememberBrowser"
            :label="$t('AbpAccount::RememberBrowser')"
          />
          <AccountCaptcha
            v-if="captchaAction"
            :key="config.snapshot().currentTenant.id ?? ''"
            ref="captcha"
            :action="captchaAction"
          />
          <AbpButton
            v-if="mode === 'two-factor' && provider !== 'Authenticator'"
            variant="secondary"
            :disabled="!provider"
            @click="sendCode"
            >{{ $t('AbpAccount::ReSendCode') }}</AbpButton
          >
          <p v-if="codeSent" role="status">
            {{ $t('AbpAccount::VerifySecurityCode_Information') }}
          </p>
          <AbpButton type="submit" :loading="busy" :disabled="mode === 'two-factor' && !provider">{{
            $t(
              mode === 'login'
                ? 'AbpAccount::Login'
                : mode === 'register'
                  ? 'AbpAccount::Register'
                  : 'AbpAccount::Submit',
            )
          }}</AbpButton>
        </fieldset>
      </form>
    </template>
    <div class="d-flex flex-wrap gap-3 mt-3">
      <RouterLink v-if="mode !== 'login'" :to="authLink('login')">{{
        $t('AbpAccount::BackToLogin')
      }}</RouterLink>
      <template v-if="mode === 'login'">
        <RouterLink :to="authLink('forgot-password')">{{
          $t('AbpAccount::ForgotPassword')
        }}</RouterLink>
        <RouterLink v-if="wrapper.isSelfRegistrationEnabled.value" :to="authLink('register')">{{
          $t('AbpAccount::Register')
        }}</RouterLink>
      </template>
      <RouterLink v-if="mode === 'two-factor'" :to="authLink('login-with-recovery-code')">{{
        $t('AbpAccount::LoginWithRecoveryCode_URL')
      }}</RouterLink>
      <RouterLink v-if="mode === 'recovery-code'" :to="authLink('send-security-code')">{{
        $t('AbpAccount::TwoFactorVerification')
      }}</RouterLink>
    </div>
    <AbpButton
      v-if="needsReload || (failed && mode === 'two-factor')"
      class="mt-3"
      variant="secondary"
      @click="recoverFailure"
      >{{ $t(mode === 'register' ? 'AbpAccount::BackToLogin' : 'AbpUi::Refresh') }}</AbpButton
    >
  </div>
</template>
<script setup lang="ts">
import { useAuthWrapper } from '@lsw-abpvue/account-core';
import { ACCOUNT_PRO_OPTIONS } from '@lsw-abpvue/account-pro/config';
import { AccountService } from '@lsw-abpvue/account-pro/proxy';
import {
  AuthService,
  ConfigStateService,
  inject as injectAbp,
  type LoginParams,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpToggle,
  useAbpForm,
  usePasswordValidators,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { AccountAuthFlowService, type AccountAuthStep } from '../services/auth-flow.service.js';
import { useAccountOperation } from '../utils/use-account-operation.js';
import { ACCOUNT_PRO_CONFIG_OPTIONS } from '../tokens/config-options.token.js';
import AccountCaptcha from './AccountCaptcha.vue';
import PasswordStrength from './PasswordStrength.vue';

const props = defineProps<{
  mode:
    | 'login'
    | 'register'
    | 'forgot-password'
    | 'reset-password'
    | 'two-factor'
    | 'recovery-code'
    | 'change-password';
}>();
const mode = props.mode;
const account = injectAbp(AccountService);
const flow = injectAbp(AccountAuthFlowService);
const auth = injectAbp(AuthService);
const config = injectAbp(ConfigStateService);
const options = { ...injectAbp(ACCOUNT_PRO_OPTIONS), ...injectAbp(ACCOUNT_PRO_CONFIG_OPTIONS) };
const wrapper = useAuthWrapper();
const route = useRoute();
const router = useRouter();
const rules = usePasswordValidators();
const messages = useValidationMessages();
const { busy, failed, needsReload, run, invalidate } = useAccountOperation();
const captcha = ref<InstanceType<typeof AccountCaptcha>>();
const providers = ref<string[]>([]);
const provider = ref('');
const rememberMe = ref(false);
const rememberBrowser = ref(false);
const codeSent = ref(false);
const capsLock = ref(false);
const done = ref(false);
const resetUsable = ref(mode !== 'reset-password');
const passwordMode = ['register', 'reset-password', 'change-password'].includes(mode);
const required = (condition: boolean) => (condition ? [Validators.required()] : []);
const form = useAbpForm({
  username: {
    value: '',
    validators: [...required(mode === 'login' || mode === 'register'), Validators.maxLength(256)],
  },
  email: {
    value: '',
    validators: [
      ...required(mode === 'register' || mode === 'forgot-password'),
      Validators.email(),
    ],
  },
  password: {
    value: '',
    validators: [...required(mode === 'login' || passwordMode), ...(passwordMode ? rules : [])],
  },
  confirmPassword: {
    value: '',
    validators:
      passwordMode && mode !== 'register'
        ? [Validators.required(), Validators.compare('password')]
        : [],
  },
  currentPassword: { value: '', validators: required(mode === 'change-password') },
  code: { value: '', validators: required(mode === 'two-factor' || mode === 'recovery-code') },
});
useServerValidation(form);
type Field = {
  name: keyof typeof form.controls;
  label: string;
  type: 'text' | 'password' | 'email';
  autocomplete: string;
};
const fields: Field[] = [
  ...(['login', 'register'].includes(mode)
    ? [
        {
          name: 'username',
          label: mode === 'login' ? 'AbpAccount::UserNameOrEmailAddress' : 'AbpAccount::UserName',
          type: 'text',
          autocomplete: 'username',
        } as const,
      ]
    : []),
  ...(['register', 'forgot-password'].includes(mode)
    ? [
        {
          name: 'email',
          label: 'AbpAccount::EmailAddress',
          type: 'email',
          autocomplete: 'email',
        } as const,
      ]
    : []),
  ...(mode === 'change-password'
    ? [
        {
          name: 'currentPassword',
          label: 'AbpIdentity::DisplayName:CurrentPassword',
          type: 'password',
          autocomplete: 'current-password',
        } as const,
      ]
    : []),
  ...(['login', 'register', 'reset-password', 'change-password'].includes(mode)
    ? [
        {
          name: 'password',
          label:
            mode === 'change-password'
              ? 'AbpIdentity::DisplayName:NewPassword'
              : 'AbpAccount::Password',
          type: 'password',
          autocomplete: mode === 'login' ? 'current-password' : 'new-password',
        } as const,
      ]
    : []),
  ...(['reset-password', 'change-password'].includes(mode)
    ? [
        {
          name: 'confirmPassword',
          label: 'AbpAccount::ConfirmPassword',
          type: 'password',
          autocomplete: 'new-password',
        } as const,
      ]
    : []),
  ...(['two-factor', 'recovery-code'].includes(mode)
    ? [
        {
          name: 'code',
          label: mode === 'two-factor' ? 'AbpAccount::Code' : 'AbpAccount::RecoveryCode',
          type: 'text',
          autocomplete: 'one-time-code',
        } as const,
      ]
    : []),
];
const titles = {
  login: 'Login',
  register: 'Register',
  'forgot-password': 'ForgotPassword',
  'reset-password': 'ResetPassword',
  'two-factor': 'TwoFactorVerification',
  'recovery-code': 'LoginWithRecoveryCode',
  'change-password': 'ChangePassword',
} as const;
const title = `AbpAccount::${titles[mode]}`;
const captchaAction =
  mode === 'login' || mode === 'register' || mode === 'forgot-password' ? mode : undefined;
const rememberBrowserEnabled = computed(
  () =>
    config
      .snapshot()
      .setting.values['Abp.Account.TwoFactorLogin.IsRememberBrowserEnabled']?.toLowerCase() ===
    'true',
);
const available = computed(() => {
  if (mode === 'login') return wrapper.isLocalLoginEnabled.value;
  if (mode === 'register') return wrapper.isSelfRegistrationEnabled.value;
  if (mode === 'reset-password')
    return resetUsable.value && Boolean(query('userId') && query('resetToken'));
  if (mode === 'two-factor' || mode === 'recovery-code')
    return Boolean(flow.challenge.value?.twoFactorToken);
  if (mode === 'change-password') return flow.challenge.value?.step === 'change-password';
  return true;
});
function query(name: string): string {
  const value = route.query[name];
  return typeof value === 'string' ? value : '';
}
function destination(): string {
  const value = query('returnUrl') || options.redirectUrl || '/';
  return value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    [...value].every(character => character.charCodeAt(0) >= 32)
    ? value
    : '/';
}
function authLink(page: string) {
  return { path: `/account/${page}`, query: { returnUrl: query('returnUrl') || undefined } };
}
const stepPaths: Record<AccountAuthStep, string> = {
  'two-factor': 'send-security-code',
  'recovery-code': 'login-with-recovery-code',
  'change-password': 'change-password',
  'confirm-user': 'confirm-user',
};
async function navigate(step: AccountAuthStep | undefined): Promise<void> {
  if (step) await router.push(authLink(stepPaths[step]));
}
async function sendCode(): Promise<void> {
  const challenge = flow.challenge.value;
  if (!challenge?.twoFactorToken || !provider.value || provider.value === 'Authenticator') return;
  await run(
    signal =>
      account.sendTwoFactorCode(
        {
          userId: challenge.userId,
          token: challenge.twoFactorToken ?? '',
          provider: provider.value,
        },
        { signal },
      ),
    () => {
      codeSent.value = true;
    },
  );
}
async function submit(): Promise<void> {
  if (!available.value || busy.value || needsReload.value || done.value || !form.validate()) return;
  const values = form.value;
  let captchaResponse: string | undefined;
  const challenge = captcha.value;
  if (
    challenge &&
    !(await run(
      () => challenge.getToken(),
      value => {
        captchaResponse = value;
      },
    ))
  )
    return;
  if (
    mode === 'register' &&
    !(await run(
      signal =>
        account.register(
          {
            userName: values.username,
            emailAddress: values.email,
            password: values.password,
            appName: options.appName ?? 'Vue',
            captchaResponse,
          },
          { signal },
        ),
      () => {},
      true,
    ))
  ) {
    captcha.value?.reset();
    return;
  }
  await run(
    async signal => {
      if (mode === 'forgot-password') {
        await account.sendPasswordResetCode(
          { email: values.email, appName: options.appName ?? 'Vue', captchaResponse },
          { signal },
        );
        if (!signal.aborted) done.value = true;
        return;
      }
      if (mode === 'reset-password') {
        await account.resetPassword(
          { userId: query('userId'), resetToken: query('resetToken'), password: values.password },
          mailRequest(signal),
        );
        if (signal.aborted) return;
        done.value = true;
        form.reset();
        const next = { ...route.query };
        delete next.resetToken;
        await router.replace({ query: next, hash: route.hash });
        return;
      }
      if (mode === 'two-factor')
        return navigate(await flow.verify(provider.value, values.code, rememberBrowser.value));
      if (mode === 'recovery-code') return navigate(await flow.recover(values.code));
      if (mode === 'change-password')
        return navigate(await flow.changePassword(values.currentPassword, values.password));
      if (mode === 'login' && captchaResponse)
        await account.recaptchaByCaptchaResponse(captchaResponse, { signal });
      const params: LoginParams = {
        username: values.username,
        password: values.password,
        rememberMe: rememberMe.value,
        redirectUrl: destination(),
      };
      await navigate(await flow.login(params));
    },
    () => {},
    mode === 'reset-password',
  );
  if (failed.value) captcha.value?.reset();
}
function restart(): void {
  flow.clear();
  form.reset();
  needsReload.value = false;
  failed.value = false;
  void router.replace(authLink('login'));
}
function mailRequest(signal: AbortSignal) {
  return { signal, skipAuthorization: true, headers: { __tenant: query('__tenant') } };
}
function verifyReset(): Promise<boolean> {
  if (!query('userId') || !query('resetToken')) return Promise.resolve(false);
  return run(
    signal =>
      account.verifyPasswordResetToken(
        { userId: query('userId'), resetToken: query('resetToken') },
        mailRequest(signal),
      ),
    valid => {
      resetUsable.value = valid;
    },
  );
}
function loadProviders(): Promise<boolean> {
  const challenge = flow.challenge.value;
  if (!challenge?.twoFactorToken) return Promise.resolve(false);
  return run(
    signal =>
      account.getTwoFactorProviders(
        { userId: challenge.userId, token: challenge.twoFactorToken ?? '' },
        { signal },
      ),
    values => {
      providers.value = values;
      provider.value = values[0] ?? '';
    },
  );
}
function recoverFailure(): void {
  if (mode === 'two-factor') void loadProviders();
  else if (mode === 'reset-password') void verifyReset();
  else restart();
}
watch(provider, () => {
  form.controls.code.reset('');
  codeSent.value = false;
});
watch(
  () => [query('userId'), query('resetToken'), query('__tenant')],
  () => {
    if (mode !== 'reset-password' || (done.value && !query('resetToken'))) return;
    invalidate();
    done.value = false;
    resetUsable.value = false;
    form.reset();
    void verifyReset();
  },
  { immediate: true },
);
onMounted(async () => {
  if (mode === 'login') flow.clear();
  if (mode === 'two-factor' && flow.challenge.value?.twoFactorToken) {
    await loadProviders();
  }
  if (mode === 'login' && !auth.isInternalAuth) await auth.navigateToLogin(destination());
});
onBeforeRouteLeave(to => {
  if (
    ![
      '/account/send-security-code',
      '/account/login-with-recovery-code',
      '/account/change-password',
      '/account/confirm-user',
    ].includes(to.path)
  )
    flow.clear();
});
onScopeDispose(() => form.reset());
</script>
