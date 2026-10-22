import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { AbpLoginResult, LinkUserLoginInfo, UserLoginInfo } from './models/models.js';

export const LoginService = defineService('LoginService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    checkPasswordByLogin: (login: UserLoginInfo, config?: RestConfig): Promise<AbpLoginResult> =>
      rest.request<UserLoginInfo, AbpLoginResult>(
        { method: 'POST', url: '/api/account/checkPassword', body: login },
        { apiName, ...config },
      ),

    creationPasskeyOptions: (config?: RestConfig): Promise<string> =>
      rest.request<never, string>(
        { method: 'POST', responseType: 'text', url: '/api/account/creationPasskeyOptions' },
        { apiName, ...config },
      ),

    linkLoginByLogin: (login: LinkUserLoginInfo, config?: RestConfig): Promise<AbpLoginResult> =>
      rest.request<LinkUserLoginInfo, AbpLoginResult>(
        { method: 'POST', url: '/api/account/linkLogin', body: login },
        { apiName, ...config },
      ),

    loginByLogin: (login: UserLoginInfo, config?: RestConfig): Promise<AbpLoginResult> =>
      rest.request<UserLoginInfo, AbpLoginResult>(
        { method: 'POST', url: '/api/account/login', body: login },
        { apiName, ...config },
      ),

    logout: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'GET', url: '/api/account/logout' },
        { apiName, ...config },
      ),

    passkeyRequestOptionsByUsernameOrEmail: (
      usernameOrEmail: string,
      config?: RestConfig,
    ): Promise<string> =>
      rest.request<never, string>(
        {
          method: 'POST',
          responseType: 'text',
          url: '/api/account/passkeyRequestOptions',
          params: { usernameOrEmail },
        },
        { apiName, ...config },
      ),

    registerPasskeyByCredential: (credential: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/account/registerPasskey', params: { credential } },
        { apiName, ...config },
      ),
  };
});
export type LoginService = ServiceOf<typeof LoginService>;
