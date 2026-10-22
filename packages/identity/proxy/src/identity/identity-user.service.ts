import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  GetIdentityUsersInput,
  IdentityRoleDto,
  IdentityUserCreateDto,
  IdentityUserDto,
  IdentityUserUpdateDto,
  IdentityUserUpdateRolesDto,
} from './models.js';

export const IdentityUserService = defineService('IdentityUserService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    create: (input: IdentityUserCreateDto, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<IdentityUserCreateDto, IdentityUserDto>(
        { method: 'POST', url: '/api/identity/users', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/identity/users/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    findByEmail: (email: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        { method: 'GET', url: `/api/identity/users/by-email/${encodeURIComponent(String(email))}` },
        { apiName, ...config },
      ),

    findById: (id: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        { method: 'GET', url: `/api/identity/users/by-id/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    findByUsername: (userName: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        {
          method: 'GET',
          url: `/api/identity/users/by-username/${encodeURIComponent(String(userName))}`,
        },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        { method: 'GET', url: `/api/identity/users/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getAssignableRoles: (config?: RestConfig): Promise<ListResultDto<IdentityRoleDto>> =>
      rest.request<never, ListResultDto<IdentityRoleDto>>(
        { method: 'GET', url: '/api/identity/users/assignable-roles' },
        { apiName, ...config },
      ),

    getList: (
      input: GetIdentityUsersInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityUserDto>> =>
      rest.request<never, PagedResultDto<IdentityUserDto>>(
        {
          method: 'GET',
          url: '/api/identity/users',
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

    getRoles: (id: string, config?: RestConfig): Promise<ListResultDto<IdentityRoleDto>> =>
      rest.request<never, ListResultDto<IdentityRoleDto>>(
        { method: 'GET', url: `/api/identity/users/${encodeURIComponent(String(id))}/roles` },
        { apiName, ...config },
      ),

    update: (
      id: string,
      input: IdentityUserUpdateDto,
      config?: RestConfig,
    ): Promise<IdentityUserDto> =>
      rest.request<IdentityUserUpdateDto, IdentityUserDto>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),

    updateRoles: (
      id: string,
      input: IdentityUserUpdateRolesDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<IdentityUserUpdateRolesDto, void>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/roles`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type IdentityUserService = ServiceOf<typeof IdentityUserService>;
