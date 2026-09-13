import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { ChangePasswordInput, ProfileDto, UpdateProfileDto } from './models.js';

export const ProfileService = defineService('ProfileService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccount';

  return {
    apiName,

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

    update: (input: UpdateProfileDto, config?: RestConfig): Promise<ProfileDto> =>
      rest.request<UpdateProfileDto, ProfileDto>(
        { method: 'PUT', url: '/api/account/my-profile', body: input },
        { apiName, ...config },
      ),
  };
});
export type ProfileService = ServiceOf<typeof ProfileService>;
