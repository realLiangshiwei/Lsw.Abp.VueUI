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
        { method: 'GET', url: `/api/identity/users/lookup/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    findByUserName: (userName: string, config?: RestConfig): Promise<UserData> =>
      rest.request<never, UserData>(
        {
          method: 'GET',
          url: `/api/identity/users/lookup/by-username/${encodeURIComponent(String(userName))}`,
        },
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
            sorting: input.sorting,
            filter: input.filter,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),
  };
});
export type IdentityUserLookupService = ServiceOf<typeof IdentityUserLookupService>;
