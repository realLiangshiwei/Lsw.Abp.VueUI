import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  ClaimTypeDto,
  GetIdentityRoleListInput,
  IdentityRoleClaimDto,
  IdentityRoleCreateDto,
  IdentityRoleDto,
  IdentityRoleUpdateDto,
} from './models.js';

export const IdentityRoleService = defineService('IdentityRoleService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    create: (input: IdentityRoleCreateDto, config?: RestConfig): Promise<IdentityRoleDto> =>
      rest.request<IdentityRoleCreateDto, IdentityRoleDto>(
        { method: 'POST', url: '/api/identity/roles', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/identity/roles/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<IdentityRoleDto> =>
      rest.request<never, IdentityRoleDto>(
        { method: 'GET', url: `/api/identity/roles/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getAllClaimTypes: (config?: RestConfig): Promise<ClaimTypeDto[]> =>
      rest.request<never, ClaimTypeDto[]>(
        { method: 'GET', url: '/api/identity/roles/all-claim-types' },
        { apiName, ...config },
      ),

    getAllList: (config?: RestConfig): Promise<ListResultDto<IdentityRoleDto>> =>
      rest.request<never, ListResultDto<IdentityRoleDto>>(
        { method: 'GET', url: '/api/identity/roles/all' },
        { apiName, ...config },
      ),

    getClaims: (id: string, config?: RestConfig): Promise<IdentityRoleClaimDto[]> =>
      rest.request<never, IdentityRoleClaimDto[]>(
        { method: 'GET', url: `/api/identity/roles/${encodeURIComponent(String(id))}/claims` },
        { apiName, ...config },
      ),

    getList: (
      input: GetIdentityRoleListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityRoleDto>> =>
      rest.request<never, PagedResultDto<IdentityRoleDto>>(
        {
          method: 'GET',
          url: '/api/identity/roles',
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

    moveAllUsers: (id: string, roleId: string | null, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/identity/roles/${encodeURIComponent(String(id))}/move-all-users`,
          params: { roleId },
        },
        { apiName, ...config },
      ),

    update: (
      id: string,
      input: IdentityRoleUpdateDto,
      config?: RestConfig,
    ): Promise<IdentityRoleDto> =>
      rest.request<IdentityRoleUpdateDto, IdentityRoleDto>(
        {
          method: 'PUT',
          url: `/api/identity/roles/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),

    updateClaims: (
      id: string,
      input: readonly IdentityRoleClaimDto[],
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<readonly IdentityRoleClaimDto[], void>(
        {
          method: 'PUT',
          url: `/api/identity/roles/${encodeURIComponent(String(id))}/claims`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type IdentityRoleService = ServiceOf<typeof IdentityRoleService>;
