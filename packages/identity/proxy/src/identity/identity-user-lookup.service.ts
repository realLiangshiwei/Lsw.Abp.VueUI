import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { UserData } from '../users/models.js';
import type { UserLookupCountInputDto, UserLookupSearchInputDto } from './models.js';

export const IdentityUserLookupService = defineService('IdentityUserLookupService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    findById: (id: string, config?: RestConfig): Promise<UserData> =>
      rest.request<never, UserData>(
        { method: 'GET', url: `/api/identity/users/lookup/${id}` },
        { apiName, ...config },
      ),

    findByUserName: (userName: string, config?: RestConfig): Promise<UserData> =>
      rest.request<never, UserData>(
        { method: 'GET', url: `/api/identity/users/lookup/by-username/${userName}` },
        { apiName, ...config },
      ),

    getCount: (input: UserLookupCountInputDto, config?: RestConfig): Promise<number> =>
      rest.request<never, number>(
        {
          method: 'GET',
          url: '/api/identity/users/lookup/count',
          params: { filter: input.filter },
        },
        { apiName, ...config },
      ),

    search: (
      input: UserLookupSearchInputDto,
      config?: RestConfig,
    ): Promise<ListResultDto<UserData>> =>
      rest.request<never, ListResultDto<UserData>>(
        {
          method: 'GET',
          url: '/api/identity/users/lookup/search',
          params: {
            ...input.extraProperties,
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),
  };
});
export type IdentityUserLookupService = ServiceOf<typeof IdentityUserLookupService>;
