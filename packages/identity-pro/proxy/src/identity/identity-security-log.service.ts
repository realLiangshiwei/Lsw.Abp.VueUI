import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { GetIdentitySecurityLogListInput, IdentitySecurityLogDto } from './models.js';

export const IdentitySecurityLogService = defineService('IdentitySecurityLogService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    get: (id: string, config?: RestConfig): Promise<IdentitySecurityLogDto> =>
      rest.request<never, IdentitySecurityLogDto>(
        { method: 'GET', url: `/api/identity/security-logs/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getList: (
      input: GetIdentitySecurityLogListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentitySecurityLogDto>> =>
      rest.request<never, PagedResultDto<IdentitySecurityLogDto>>(
        {
          method: 'GET',
          url: '/api/identity/security-logs',
          params: {
            startTime: input.startTime,
            endTime: input.endTime,
            applicationName: input.applicationName,
            identity: input.identity,
            action: input.action,
            userName: input.userName,
            clientId: input.clientId,
            correlationId: input.correlationId,
            clientIpAddress: input.clientIpAddress,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),
  };
});
export type IdentitySecurityLogService = ServiceOf<typeof IdentitySecurityLogService>;
