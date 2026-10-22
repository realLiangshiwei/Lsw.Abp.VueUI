import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { AccountExternalLoginDto } from './models.js';

export const AccountExternalLoginService = defineService('AccountExternalLoginService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    delete: (loginProvider: string, providerKey: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: `/api/account/externallogin/${encodeURIComponent(String(loginProvider))}/${encodeURIComponent(String(providerKey))}`,
        },
        { apiName, ...config },
      ),

    getList: (config?: RestConfig): Promise<AccountExternalLoginDto[]> =>
      rest.request<never, AccountExternalLoginDto[]>(
        { method: 'GET', url: '/api/account/externallogin' },
        { apiName, ...config },
      ),

    hasPasswordVerified: (
      userId: string,
      loginProvider: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<boolean> =>
      rest.request<never, boolean>(
        {
          method: 'GET',
          url: `/api/account/externallogin/password-verified/${encodeURIComponent(String(userId))}/${encodeURIComponent(String(loginProvider))}/${encodeURIComponent(String(providerKey))}`,
        },
        { apiName, ...config },
      ),

    removePasswordVerified: (
      loginProvider: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: `/api/account/externallogin/${encodeURIComponent(String(loginProvider))}/${encodeURIComponent(String(providerKey))}/password-verified`,
        },
        { apiName, ...config },
      ),

    setPasswordVerified: (
      loginProvider: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'POST',
          url: `/api/account/externallogin/password-verified/${encodeURIComponent(String(loginProvider))}/${encodeURIComponent(String(providerKey))}`,
        },
        { apiName, ...config },
      ),
  };
});
export type AccountExternalLoginService = ServiceOf<typeof AccountExternalLoginService>;
