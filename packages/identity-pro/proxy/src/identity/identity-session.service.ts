import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { GetIdentitySessionListInput, IdentitySessionDto } from './models.js';

export const IdentitySessionService = defineService('IdentitySessionService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    get: (id: string, config?: RestConfig): Promise<IdentitySessionDto> =>
      rest.request<never, IdentitySessionDto>(
        { method: 'GET', url: `/api/identity/sessions/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getList: (
      input: GetIdentitySessionListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentitySessionDto>> =>
      rest.request<never, PagedResultDto<IdentitySessionDto>>(
        {
          method: 'GET',
          url: '/api/identity/sessions',
          params: {
            userId: input.userId,
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
        { method: 'DELETE', url: `/api/identity/sessions/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),
  };
});
export type IdentitySessionService = ServiceOf<typeof IdentitySessionService>;
