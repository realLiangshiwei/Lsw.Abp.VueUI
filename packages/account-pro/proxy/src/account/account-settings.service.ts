import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  AccountEmailLoginSettingsDto,
  AccountExternalProviderSettingsDto,
  AccountIdleSettingsDto,
  AccountPasskeySettingsDto,
  AccountRecaptchaSettingsDto,
  AccountSettingsDto,
  AccountTwoFactorSettingsDto,
} from './models.js';

export const AccountSettingsService = defineService('AccountSettingsService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountAdmin';

  return {
    apiName,

    get: (config?: RestConfig): Promise<AccountSettingsDto> =>
      rest.request<never, AccountSettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings' },
        { apiName, ...config },
      ),

    getEmailLogin: (config?: RestConfig): Promise<AccountEmailLoginSettingsDto> =>
      rest.request<never, AccountEmailLoginSettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings/email-login' },
        { apiName, ...config },
      ),

    getExternalProvider: (config?: RestConfig): Promise<AccountExternalProviderSettingsDto> =>
      rest.request<never, AccountExternalProviderSettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings/external-provider' },
        { apiName, ...config },
      ),

    getIdle: (config?: RestConfig): Promise<AccountIdleSettingsDto> =>
      rest.request<never, AccountIdleSettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings/idle' },
        { apiName, ...config },
      ),

    getPasskey: (config?: RestConfig): Promise<AccountPasskeySettingsDto> =>
      rest.request<never, AccountPasskeySettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings/passkey' },
        { apiName, ...config },
      ),

    getRecaptcha: (config?: RestConfig): Promise<AccountRecaptchaSettingsDto> =>
      rest.request<never, AccountRecaptchaSettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings/recaptcha' },
        { apiName, ...config },
      ),

    getTwoFactor: (config?: RestConfig): Promise<AccountTwoFactorSettingsDto> =>
      rest.request<never, AccountTwoFactorSettingsDto>(
        { method: 'GET', url: '/api/account-admin/settings/two-factor' },
        { apiName, ...config },
      ),

    update: (input: AccountSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AccountSettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings', body: input },
        { apiName, ...config },
      ),

    updateEmailLogin: (input: AccountEmailLoginSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AccountEmailLoginSettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings/email-login', body: input },
        { apiName, ...config },
      ),

    updateExternalProvider: (
      input: AccountExternalProviderSettingsDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<AccountExternalProviderSettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings/external-provider', body: input },
        { apiName, ...config },
      ),

    updateIdle: (input: AccountIdleSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AccountIdleSettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings/idle', body: input },
        { apiName, ...config },
      ),

    updatePasskey: (input: AccountPasskeySettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AccountPasskeySettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings/passkey', body: input },
        { apiName, ...config },
      ),

    updateRecaptcha: (input: AccountRecaptchaSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AccountRecaptchaSettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings/recaptcha', body: input },
        { apiName, ...config },
      ),

    updateTwoFactor: (input: AccountTwoFactorSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<AccountTwoFactorSettingsDto, void>(
        { method: 'PUT', url: '/api/account-admin/settings/two-factor', body: input },
        { apiName, ...config },
      ),
  };
});
export type AccountSettingsService = ServiceOf<typeof AccountSettingsService>;
