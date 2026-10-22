import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { IdentitySessionDto } from '../identity/models.js';
import type { GetAccountIdentitySessionListInput } from './models.js';

export const AccountSessionService = defineService('AccountSessionService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccountPublic';

  return {
    apiName,

    get: (id: string, config?: RestConfig): Promise<IdentitySessionDto> =>
      rest.request<never, IdentitySessionDto>(
        { method: 'GET', url: `/api/account/sessions/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getList: (
      input: GetAccountIdentitySessionListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentitySessionDto>> =>
      rest.request<never, PagedResultDto<IdentitySessionDto>>(
        {
          method: 'GET',
          url: '/api/account/sessions',
          params: {
            device: input.device,
            clientId: input.clientId,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    revoke: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/account/sessions/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),
  };
});
export type AccountSessionService = ServiceOf<typeof AccountSessionService>;
