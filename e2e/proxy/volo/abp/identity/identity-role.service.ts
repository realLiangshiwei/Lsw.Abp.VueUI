import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  GetIdentityRolesInput,
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
        { method: 'DELETE', url: `/api/identity/roles/${id}` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<IdentityRoleDto> =>
      rest.request<never, IdentityRoleDto>(
        { method: 'GET', url: `/api/identity/roles/${id}` },
        { apiName, ...config },
      ),

    getAllList: (config?: RestConfig): Promise<ListResultDto<IdentityRoleDto>> =>
      rest.request<never, ListResultDto<IdentityRoleDto>>(
        { method: 'GET', url: '/api/identity/roles/all' },
        { apiName, ...config },
      ),

    getList: (
      input: GetIdentityRolesInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityRoleDto>> =>
      rest.request<never, PagedResultDto<IdentityRoleDto>>(
        {
          method: 'GET',
          url: '/api/identity/roles',
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

    update: (
      id: string,
      input: IdentityRoleUpdateDto,
      config?: RestConfig,
    ): Promise<IdentityRoleDto> =>
      rest.request<IdentityRoleUpdateDto, IdentityRoleDto>(
        { method: 'PUT', url: `/api/identity/roles/${id}`, body: input },
        { apiName, ...config },
      ),
  };
});
export type IdentityRoleService = ServiceOf<typeof IdentityRoleService>;
