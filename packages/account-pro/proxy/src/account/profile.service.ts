import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { NameValue, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { ChangePasswordInput, PasskeyDto, ProfileDto, UpdateProfileDto } from './models.js';

export const ProfileService = defineService('ProfileService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    canEnableTwoFactor: (config?: RestConfig): Promise<boolean> =>
      rest.request<never, boolean>(
        { method: 'GET', url: '/api/account/my-profile/can-enable-two-factor' },
        { apiName, ...config },
      ),

    changePassword: (input: ChangePasswordInput, config?: RestConfig): Promise<void> =>
      rest.request<ChangePasswordInput, void>(
        { method: 'POST', url: '/api/account/my-profile/change-password', body: input },
        { apiName, ...config },
      ),

    get: (config?: RestConfig): Promise<ProfileDto> =>
      rest.request<never, ProfileDto>(
        { method: 'GET', url: '/api/account/my-profile' },
        { apiName, ...config },
      ),

    getPasskeys: (config?: RestConfig): Promise<PasskeyDto[]> =>
      rest.request<never, PasskeyDto[]>(
        { method: 'GET', url: '/api/account/my-profile/passkeys' },
        { apiName, ...config },
      ),

    getTimezones: (config?: RestConfig): Promise<NameValue[]> =>
      rest.request<never, NameValue[]>(
        { method: 'GET', url: '/api/account/my-profile/timezones' },
        { apiName, ...config },
      ),

    getTwoFactorEnabled: (config?: RestConfig): Promise<boolean> =>
      rest.request<never, boolean>(
        { method: 'GET', url: '/api/account/my-profile/two-factor-enabled' },
        { apiName, ...config },
      ),

    removePasskey: (credential: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: '/api/account/my-profile/passkeys', params: { credential } },
        { apiName, ...config },
      ),

    setTwoFactorEnabled: (enabled: boolean, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'POST',
          url: '/api/account/my-profile/set-two-factor-enabled',
          params: { enabled },
        },
        { apiName, ...config },
      ),

    update: (input: UpdateProfileDto, config?: RestConfig): Promise<ProfileDto> =>
      rest.request<UpdateProfileDto, ProfileDto>(
        { method: 'PUT', url: '/api/account/my-profile', body: input },
        { apiName, ...config },
      ),
  };
});
export type ProfileService = ServiceOf<typeof ProfileService>;
