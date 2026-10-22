import {
  AuthError,
  AuthService,
  ConfigStateService,
  defineService,
  inject,
  onServiceDestroy,
  TwoFactorRequiredError,
  type LoginParams,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, shallowRef, watch } from 'vue';

export type AccountAuthStep = 'two-factor' | 'recovery-code' | 'change-password' | 'confirm-user';
export interface AccountAuthChallenge {
  step: AccountAuthStep;
  userId: string;
  twoFactorToken?: string | undefined;
  email?: string | undefined;
  phoneNumber?: string | undefined;
}

export const AccountAuthFlowService = defineService('AccountAuthFlowService', () => {
  const auth = inject(AuthService);
  const config = inject(ConfigStateService);
  const challenge = shallowRef<AccountAuthChallenge>();
  let credentials: LoginParams | undefined;
  let changePasswordToken: string | undefined;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;

  function clear(): void {
    revision += 1;
    credentials = undefined;
    changePasswordToken = undefined;
    challenge.value = undefined;
    if (expiry) clearTimeout(expiry);
    expiry = undefined;
  }

  async function login(params: LoginParams): Promise<AccountAuthStep | undefined> {
    const own = ++revision;
    const previous = challenge.value;
    if (!previous)
      credentials = {
        username: params.username,
        password: params.password,
        rememberMe: params.rememberMe,
        redirectUrl: params.redirectUrl,
      };
    try {
      await auth.login(params);
      if (own === revision) clear();
      return undefined;
    } catch (error) {
      if (own !== revision) throw error;
      if (!(error instanceof AuthError)) {
        if (!previous) clear();
        throw error;
      }
      const userId = typeof error.params.userId === 'string' ? error.params.userId : '';
      if (error instanceof TwoFactorRequiredError) {
        if (params.newPassword && credentials)
          credentials = { ...credentials, password: params.newPassword };
        challenge.value = {
          step: 'two-factor',
          userId: error.userId,
          twoFactorToken: error.twoFactorToken,
        };
      } else if (
        ['ShouldChangePasswordOnNextLogin', 'PeriodicallyChangePassword'].includes(
          error.errorDescription ?? '',
        ) &&
        typeof error.params.changePasswordToken === 'string'
      ) {
        changePasswordToken = error.params.changePasswordToken;
        challenge.value = { step: 'change-password', userId };
      } else if (error.errorDescription === 'RequiresConfirmUser' && userId) {
        challenge.value = {
          step: 'confirm-user',
          userId,
          email: typeof error.params.email === 'string' ? error.params.email : undefined,
          phoneNumber:
            typeof error.params.phoneNumber === 'string' ? error.params.phoneNumber : undefined,
        };
      } else {
        if (!previous) clear();
        throw error;
      }
      if (expiry) clearTimeout(expiry);
      expiry = setTimeout(clear, 10 * 60_000);
      return challenge.value?.step;
    }
  }

  onServiceDestroy(
    watch(
      [() => config.snapshot().currentUser.id, () => config.snapshot().currentTenant.id],
      clear,
      {
        flush: 'sync',
      },
    ),
  );
  onServiceDestroy(clear);
  return {
    challenge: computed(() => challenge.value),
    clear,
    login,
    verify(
      provider: string,
      code: string,
      rememberBrowser = false,
    ): Promise<AccountAuthStep | undefined> {
      if (!credentials || !challenge.value?.twoFactorToken) return Promise.resolve(undefined);
      return login({
        ...credentials,
        twoFactorProvider: provider,
        twoFactorCode: code,
        rememberBrowser,
      });
    },
    recover(code: string): Promise<AccountAuthStep | undefined> {
      if (!credentials || !challenge.value?.twoFactorToken) return Promise.resolve(undefined);
      return login({ ...credentials, rememberMe: false, recoveryCode: code.replace(/\s/g, '') });
    },
    changePassword(
      currentPassword: string,
      newPassword: string,
    ): Promise<AccountAuthStep | undefined> {
      if (!credentials || !changePasswordToken) return Promise.resolve(undefined);
      return login({ ...credentials, password: currentPassword, newPassword, changePasswordToken });
    },
  };
});
export type AccountAuthFlowService = ServiceOf<typeof AccountAuthFlowService>;
