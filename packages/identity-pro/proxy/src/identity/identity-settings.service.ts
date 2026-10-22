import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  IdentityLdapSettingsDto,
  IdentityOAuthSettingsDto,
  IdentitySessionSettingsDto,
  IdentitySettingsDto,
} from './models.js';

export const IdentitySettingsService = defineService('IdentitySettingsService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    get: (config?: RestConfig): Promise<IdentitySettingsDto> =>
      rest.request<never, IdentitySettingsDto>(
        { method: 'GET', url: '/api/identity/settings' },
        { apiName, ...config },
      ),

    getLdap: (config?: RestConfig): Promise<IdentityLdapSettingsDto> =>
      rest.request<never, IdentityLdapSettingsDto>(
        { method: 'GET', url: '/api/identity/settings/ldap' },
        { apiName, ...config },
      ),

    getOAuth: (config?: RestConfig): Promise<IdentityOAuthSettingsDto> =>
      rest.request<never, IdentityOAuthSettingsDto>(
        { method: 'GET', url: '/api/identity/settings/oauth' },
        { apiName, ...config },
      ),

    getSession: (config?: RestConfig): Promise<IdentitySessionSettingsDto> =>
      rest.request<never, IdentitySessionSettingsDto>(
        { method: 'GET', url: '/api/identity/settings/session' },
        { apiName, ...config },
      ),

    update: (input: IdentitySettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<IdentitySettingsDto, void>(
        { method: 'PUT', url: '/api/identity/settings', body: input },
        { apiName, ...config },
      ),

    updateLdap: (input: IdentityLdapSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<IdentityLdapSettingsDto, void>(
        { method: 'PUT', url: '/api/identity/settings/ldap', body: input },
        { apiName, ...config },
      ),

    updateOAuth: (input: IdentityOAuthSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<IdentityOAuthSettingsDto, void>(
        { method: 'PUT', url: '/api/identity/settings/oauth', body: input },
        { apiName, ...config },
      ),

    updateSession: (input: IdentitySessionSettingsDto, config?: RestConfig): Promise<void> =>
      rest.request<IdentitySessionSettingsDto, void>(
        { method: 'PUT', url: '/api/identity/settings/session', body: input },
        { apiName, ...config },
      ),
  };
});
export type IdentitySettingsService = ServiceOf<typeof IdentitySettingsService>;
