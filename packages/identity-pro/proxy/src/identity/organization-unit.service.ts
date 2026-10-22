import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type {
  ListResultDto,
  PagedAndSortedResultRequestDto,
  PagedResultDto,
  RestConfig,
  ServiceOf,
} from '@lsw-abpvue/core';
import type {
  GetAvailableRolesInput,
  GetAvailableUsersInput,
  GetMembersInput,
  GetOrganizationUnitInput,
  IdentityRoleDto,
  IdentityUserDto,
  OrganizationUnitCreateDto,
  OrganizationUnitMoveInput,
  OrganizationUnitRoleInput,
  OrganizationUnitUpdateDto,
  OrganizationUnitUserInput,
  OrganizationUnitWithDetailsDto,
} from './models.js';

export const OrganizationUnitService = defineService('OrganizationUnitService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    addMembers: (
      id: string,
      input: OrganizationUnitUserInput,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<OrganizationUnitUserInput, void>(
        {
          method: 'PUT',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/members`,
          body: input,
        },
        { apiName, ...config },
      ),

    addRoles: (id: string, input: OrganizationUnitRoleInput, config?: RestConfig): Promise<void> =>
      rest.request<OrganizationUnitRoleInput, void>(
        {
          method: 'PUT',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/roles`,
          body: input,
        },
        { apiName, ...config },
      ),

    create: (
      input: OrganizationUnitCreateDto,
      config?: RestConfig,
    ): Promise<OrganizationUnitWithDetailsDto> =>
      rest.request<OrganizationUnitCreateDto, OrganizationUnitWithDetailsDto>(
        { method: 'POST', url: '/api/identity/organization-units', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: '/api/identity/organization-units', params: { id } },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<OrganizationUnitWithDetailsDto> =>
      rest.request<never, OrganizationUnitWithDetailsDto>(
        {
          method: 'GET',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}`,
        },
        { apiName, ...config },
      ),

    getAvailableRoles: (
      input: GetAvailableRolesInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityRoleDto>> =>
      rest.request<never, PagedResultDto<IdentityRoleDto>>(
        {
          method: 'GET',
          url: '/api/identity/organization-units/available-roles',
          params: {
            filter: input.filter,
            id: input.id,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    getAvailableUsers: (
      input: GetAvailableUsersInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityUserDto>> =>
      rest.request<never, PagedResultDto<IdentityUserDto>>(
        {
          method: 'GET',
          url: '/api/identity/organization-units/available-users',
          params: {
            filter: input.filter,
            id: input.id,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    getList: (
      input: GetOrganizationUnitInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<OrganizationUnitWithDetailsDto>> =>
      rest.request<never, PagedResultDto<OrganizationUnitWithDetailsDto>>(
        {
          method: 'GET',
          url: '/api/identity/organization-units',
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

    getListAll: (config?: RestConfig): Promise<ListResultDto<OrganizationUnitWithDetailsDto>> =>
      rest.request<never, ListResultDto<OrganizationUnitWithDetailsDto>>(
        { method: 'GET', url: '/api/identity/organization-units/all' },
        { apiName, ...config },
      ),

    getMembers: (
      id: string,
      input: GetMembersInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityUserDto>> =>
      rest.request<never, PagedResultDto<IdentityUserDto>>(
        {
          method: 'GET',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/members`,
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    getRoles: (
      id: string,
      input: PagedAndSortedResultRequestDto,
      config?: RestConfig,
    ): Promise<PagedResultDto<IdentityRoleDto>> =>
      rest.request<never, PagedResultDto<IdentityRoleDto>>(
        {
          method: 'GET',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/roles`,
          params: {
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    move: (id: string, input: OrganizationUnitMoveInput, config?: RestConfig): Promise<void> =>
      rest.request<OrganizationUnitMoveInput, void>(
        {
          method: 'PUT',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/move`,
          body: input,
        },
        { apiName, ...config },
      ),

    moveAllUsers: (id: string, organizationId: string | null, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/move-all-users`,
          params: { organizationId },
        },
        { apiName, ...config },
      ),

    removeMember: (id: string, memberId: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/members/${encodeURIComponent(String(memberId))}`,
        },
        { apiName, ...config },
      ),

    removeRole: (id: string, roleId: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}/roles/${encodeURIComponent(String(roleId))}`,
        },
        { apiName, ...config },
      ),

    update: (
      id: string,
      input: OrganizationUnitUpdateDto,
      config?: RestConfig,
    ): Promise<OrganizationUnitWithDetailsDto> =>
      rest.request<OrganizationUnitUpdateDto, OrganizationUnitWithDetailsDto>(
        {
          method: 'PUT',
          url: `/api/identity/organization-units/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type OrganizationUnitService = ServiceOf<typeof OrganizationUnitService>;
