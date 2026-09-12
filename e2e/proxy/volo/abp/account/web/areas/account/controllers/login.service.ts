import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { AbpLoginResult, UserLoginInfo } from './models/models.js';

export const LoginService = defineService('LoginService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccount';

  return {
    apiName,

    checkPasswordByLogin: (login: UserLoginInfo, config?: RestConfig): Promise<AbpLoginResult> =>
      rest.request<UserLoginInfo, AbpLoginResult>(
        { method: 'POST', url: '/api/account/check-password', body: login },
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
  };
});
export type LoginService = ServiceOf<typeof LoginService>;
