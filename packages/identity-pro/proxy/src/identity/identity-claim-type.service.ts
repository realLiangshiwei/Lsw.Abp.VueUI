import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  ClaimTypeDto,
  CreateClaimTypeDto,
  GetIdentityClaimTypesInput,
  UpdateClaimTypeDto,
} from './models.js';

export const IdentityClaimTypeService = defineService('IdentityClaimTypeService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    create: (input: CreateClaimTypeDto, config?: RestConfig): Promise<ClaimTypeDto> =>
      rest.request<CreateClaimTypeDto, ClaimTypeDto>(
        { method: 'POST', url: '/api/identity/claim-types', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/identity/claim-types/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<ClaimTypeDto> =>
      rest.request<never, ClaimTypeDto>(
        { method: 'GET', url: `/api/identity/claim-types/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getList: (
      input: GetIdentityClaimTypesInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<ClaimTypeDto>> =>
      rest.request<never, PagedResultDto<ClaimTypeDto>>(
        {
          method: 'GET',
          url: '/api/identity/claim-types',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    update: (id: string, input: UpdateClaimTypeDto, config?: RestConfig): Promise<ClaimTypeDto> =>
      rest.request<UpdateClaimTypeDto, ClaimTypeDto>(
        {
          method: 'PUT',
          url: `/api/identity/claim-types/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type IdentityClaimTypeService = ServiceOf<typeof IdentityClaimTypeService>;
