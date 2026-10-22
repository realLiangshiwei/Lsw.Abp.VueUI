import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  ClaimTypeDto,
  DownloadTokenResultDto,
  ExternalLoginProviderDto,
  GetIdentityUserListAsFileInput,
  GetIdentityUsersInput,
  GetImportInvalidUsersFileInput,
  GetImportUsersSampleFileInput,
  IdentityRoleDto,
  IdentityRoleLookupDto,
  IdentityUserClaimDto,
  IdentityUserCreateDto,
  IdentityUserDto,
  IdentityUserUpdateDto,
  IdentityUserUpdatePasswordInput,
  IdentityUserUpdateRolesDto,
  ImportExternalUserInput,
  ImportUsersFromFileOutput,
  OrganizationUnitDto,
  OrganizationUnitLookupDto,
  OrganizationUnitWithDetailsDto,
} from './models.js';
import type {
  GetPendingInvitationsInput,
  InviteUsersInput,
  InviteUsersSummaryDto,
  ResendInvitationInput,
  UserSharingInvitationDto,
} from './user-sharing/models.js';

export const IdentityUserService = defineService('IdentityUserService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    cancelAllPendingInvitations: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: '/api/identity/users/invitations' },
        { apiName, ...config },
      ),

    cancelInvitation: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: `/api/identity/users/invitations/${encodeURIComponent(String(id))}`,
        },
        { apiName, ...config },
      ),

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

    findByUsername: (username: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        {
          method: 'GET',
          url: `/api/identity/users/by-username/${encodeURIComponent(String(username))}`,
        },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        { method: 'GET', url: `/api/identity/users/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getAllClaimTypes: (config?: RestConfig): Promise<ClaimTypeDto[]> =>
      rest.request<never, ClaimTypeDto[]>(
        { method: 'GET', url: '/api/identity/users/all-claim-types' },
        { apiName, ...config },
      ),

    getAssignableRoles: (config?: RestConfig): Promise<ListResultDto<IdentityRoleDto>> =>
      rest.request<never, ListResultDto<IdentityRoleDto>>(
        { method: 'GET', url: '/api/identity/users/assignable-roles' },
        { apiName, ...config },
      ),

    getAvailableOrganizationUnits: (
      config?: RestConfig,
    ): Promise<ListResultDto<OrganizationUnitWithDetailsDto>> =>
      rest.request<never, ListResultDto<OrganizationUnitWithDetailsDto>>(
        { method: 'GET', url: '/api/identity/users/available-organization-units' },
        { apiName, ...config },
      ),

    getClaims: (id: string, config?: RestConfig): Promise<IdentityUserClaimDto[]> =>
      rest.request<never, IdentityUserClaimDto[]>(
        { method: 'GET', url: `/api/identity/users/${encodeURIComponent(String(id))}/claims` },
        { apiName, ...config },
      ),

    getDownloadToken: (config?: RestConfig): Promise<DownloadTokenResultDto> =>
      rest.request<never, DownloadTokenResultDto>(
        { method: 'GET', url: '/api/identity/users/download-token' },
        { apiName, ...config },
      ),

    getExternalLoginProviders: (config?: RestConfig): Promise<ExternalLoginProviderDto[]> =>
      rest.request<never, ExternalLoginProviderDto[]>(
        { method: 'GET', url: '/api/identity/users/external-login-Providers' },
        { apiName, ...config },
      ),

    getImportInvalidUsersFile: (
      input: GetImportInvalidUsersFileInput,
      config?: RestConfig,
    ): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: '/api/identity/users/download-import-invalid-users-file',
          params: { token: input.token },
        },
        { apiName, ...config },
      ),

    getImportUsersSampleFile: (
      input: GetImportUsersSampleFileInput,
      config?: RestConfig,
    ): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: '/api/identity/users/import-users-sample-file',
          params: { fileType: input.fileType, token: input.token },
        },
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
            roleId: input.roleId,
            organizationUnitId: input.organizationUnitId,
            id: input.id,
            userName: input.userName,
            phoneNumber: input.phoneNumber,
            emailAddress: input.emailAddress,
            name: input.name,
            surname: input.surname,
            isLockedOut: input.isLockedOut,
            notActive: input.notActive,
            emailConfirmed: input.emailConfirmed,
            isExternal: input.isExternal,
            maxCreationTime: input.maxCreationTime,
            minCreationTime: input.minCreationTime,
            maxModifitionTime: input.maxModifitionTime,
            minModifitionTime: input.minModifitionTime,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    getListAsCsvFile: (input: GetIdentityUserListAsFileInput, config?: RestConfig): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: '/api/identity/users/export-as-csv',
          params: {
            token: input.token,
            filter: input.filter,
            roleId: input.roleId,
            organizationUnitId: input.organizationUnitId,
            id: input.id,
            userName: input.userName,
            phoneNumber: input.phoneNumber,
            emailAddress: input.emailAddress,
            name: input.name,
            surname: input.surname,
            isLockedOut: input.isLockedOut,
            notActive: input.notActive,
            emailConfirmed: input.emailConfirmed,
            isExternal: input.isExternal,
            maxCreationTime: input.maxCreationTime,
            minCreationTime: input.minCreationTime,
            maxModifitionTime: input.maxModifitionTime,
            minModifitionTime: input.minModifitionTime,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    getListAsExcelFile: (
      input: GetIdentityUserListAsFileInput,
      config?: RestConfig,
    ): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: '/api/identity/users/export-as-excel',
          params: {
            token: input.token,
            filter: input.filter,
            roleId: input.roleId,
            organizationUnitId: input.organizationUnitId,
            id: input.id,
            userName: input.userName,
            phoneNumber: input.phoneNumber,
            emailAddress: input.emailAddress,
            name: input.name,
            surname: input.surname,
            isLockedOut: input.isLockedOut,
            notActive: input.notActive,
            emailConfirmed: input.emailConfirmed,
            isExternal: input.isExternal,
            maxCreationTime: input.maxCreationTime,
            minCreationTime: input.minCreationTime,
            maxModifitionTime: input.maxModifitionTime,
            minModifitionTime: input.minModifitionTime,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
            extraProperties: input.extraProperties,
          },
        },
        { apiName, ...config },
      ),

    getOrganizationUnitLookup: (config?: RestConfig): Promise<OrganizationUnitLookupDto[]> =>
      rest.request<never, OrganizationUnitLookupDto[]>(
        { method: 'GET', url: '/api/identity/users/lookup/organization-units' },
        { apiName, ...config },
      ),

    getOrganizationUnits: (id: string, config?: RestConfig): Promise<OrganizationUnitDto[]> =>
      rest.request<never, OrganizationUnitDto[]>(
        {
          method: 'GET',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/organization-units`,
        },
        { apiName, ...config },
      ),

    getPendingInvitations: (
      input: GetPendingInvitationsInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<UserSharingInvitationDto>> =>
      rest.request<never, PagedResultDto<UserSharingInvitationDto>>(
        {
          method: 'GET',
          url: '/api/identity/users/invitations',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    getRoleLookup: (config?: RestConfig): Promise<IdentityRoleLookupDto[]> =>
      rest.request<never, IdentityRoleLookupDto[]>(
        { method: 'GET', url: '/api/identity/users/lookup/roles' },
        { apiName, ...config },
      ),

    getRoles: (id: string, config?: RestConfig): Promise<ListResultDto<IdentityRoleDto>> =>
      rest.request<never, ListResultDto<IdentityRoleDto>>(
        { method: 'GET', url: `/api/identity/users/${encodeURIComponent(String(id))}/roles` },
        { apiName, ...config },
      ),

    getTwoFactorEnabled: (id: string, config?: RestConfig): Promise<boolean> =>
      rest.request<never, boolean>(
        {
          method: 'GET',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/two-factor-enabled`,
        },
        { apiName, ...config },
      ),

    importExternalUser: (
      input: ImportExternalUserInput,
      config?: RestConfig,
    ): Promise<IdentityUserDto> =>
      rest.request<ImportExternalUserInput, IdentityUserDto>(
        { method: 'POST', url: '/api/identity/users/import-external-user', body: input },
        { apiName, ...config },
      ),

    importUsersFromFile: (
      input: FormData,
      config?: RestConfig,
    ): Promise<ImportUsersFromFileOutput> =>
      rest.request<FormData, ImportUsersFromFileOutput>(
        {
          method: 'POST',
          url: '/api/identity/users/import-users-from-file',
          params: { fileType: input.get('FileType') ?? input.get('fileType') },
          body: input,
        },
        { apiName, ...config },
      ),

    inviteUsers: (input: InviteUsersInput, config?: RestConfig): Promise<InviteUsersSummaryDto> =>
      rest.request<InviteUsersInput, InviteUsersSummaryDto>(
        { method: 'POST', url: '/api/identity/users/invitations', body: input },
        { apiName, ...config },
      ),

    lock: (id: string, lockoutEnd: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/lock/${encodeURIComponent(String(lockoutEnd))}`,
        },
        { apiName, ...config },
      ),

    removeFromTenant: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/remove-from-tenant`,
        },
        { apiName, ...config },
      ),

    resendInvitation: (input: ResendInvitationInput, config?: RestConfig): Promise<void> =>
      rest.request<ResendInvitationInput, void>(
        { method: 'POST', url: '/api/identity/users/invitations/resend', body: input },
        { apiName, ...config },
      ),

    setTwoFactorEnabled: (id: string, enabled: boolean, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/two-factor/${encodeURIComponent(String(enabled))}`,
        },
        { apiName, ...config },
      ),

    unlock: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'PUT', url: `/api/identity/users/${encodeURIComponent(String(id))}/unlock` },
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

    updateClaims: (
      id: string,
      input: readonly IdentityUserClaimDto[],
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<readonly IdentityUserClaimDto[], void>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/claims`,
          body: input,
        },
        { apiName, ...config },
      ),

    updatePassword: (
      id: string,
      input: IdentityUserUpdatePasswordInput,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<IdentityUserUpdatePasswordInput, void>(
        {
          method: 'PUT',
          url: `/api/identity/users/${encodeURIComponent(String(id))}/change-password`,
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
