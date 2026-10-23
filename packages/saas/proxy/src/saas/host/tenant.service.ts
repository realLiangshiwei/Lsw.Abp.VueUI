import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  EditionLookupDto,
  GetTenantsInput,
  SaasTenantConnectionStringsDto,
  SaasTenantCreateDto,
  SaasTenantDatabasesDto,
  SaasTenantDto,
  SaasTenantInviteUserDto,
  SaasTenantSetPasswordDto,
  SaasTenantUpdateDto,
} from './dtos/models.js';

export const TenantService = defineService('TenantService', () => {
  const rest = inject(RestService);
  const apiName = 'SaasHost';

  return {
    apiName,

    applyDatabaseMigrations: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'POST',
          url: `/api/saas/tenants/${encodeURIComponent(String(id))}/apply-database-migrations`,
        },
        { apiName, ...config },
      ),

    checkConnectionString: (connectionString: string, config?: RestConfig): Promise<boolean> =>
      rest.request<string, boolean>(
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          url: '/api/saas/tenants/check-connection-string',
          body: JSON.stringify(connectionString),
        },
        { apiName, ...config },
      ),

    create: (input: SaasTenantCreateDto, config?: RestConfig): Promise<SaasTenantDto> =>
      rest.request<SaasTenantCreateDto, SaasTenantDto>(
        { method: 'POST', url: '/api/saas/tenants', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/saas/tenants/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<SaasTenantDto> =>
      rest.request<never, SaasTenantDto>(
        { method: 'GET', url: `/api/saas/tenants/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getConnectionStrings: (
      id: string,
      config?: RestConfig,
    ): Promise<SaasTenantConnectionStringsDto> =>
      rest.request<never, SaasTenantConnectionStringsDto>(
        {
          method: 'GET',
          url: `/api/saas/tenants/${encodeURIComponent(String(id))}/connection-strings`,
        },
        { apiName, ...config },
      ),

    getDatabases: (config?: RestConfig): Promise<SaasTenantDatabasesDto> =>
      rest.request<never, SaasTenantDatabasesDto>(
        { method: 'GET', url: '/api/saas/tenants/databases' },
        { apiName, ...config },
      ),

    getEditionLookup: (config?: RestConfig): Promise<EditionLookupDto[]> =>
      rest.request<never, EditionLookupDto[]>(
        { method: 'GET', url: '/api/saas/tenants/lookup/editions' },
        { apiName, ...config },
      ),

    getList: (
      input: GetTenantsInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<SaasTenantDto>> =>
      rest.request<never, PagedResultDto<SaasTenantDto>>(
        {
          method: 'GET',
          url: '/api/saas/tenants',
          params: {
            filter: input.filter,
            getEditionNames: input.getEditionNames,
            editionId: input.editionId,
            expirationDateMin: input.expirationDateMin,
            expirationDateMax: input.expirationDateMax,
            activationState: input.activationState,
            activationEndDateMin: input.activationEndDateMin,
            activationEndDateMax: input.activationEndDateMax,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    inviteUser: (id: string, input: SaasTenantInviteUserDto, config?: RestConfig): Promise<void> =>
      rest.request<SaasTenantInviteUserDto, void>(
        {
          method: 'POST',
          url: `/api/saas/tenants/${encodeURIComponent(String(id))}/invite-user`,
          body: input,
        },
        { apiName, ...config },
      ),

    setPassword: (
      id: string,
      input: SaasTenantSetPasswordDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<SaasTenantSetPasswordDto, void>(
        {
          method: 'PUT',
          url: `/api/saas/tenants/${encodeURIComponent(String(id))}/set-password`,
          body: input,
        },
        { apiName, ...config },
      ),

    update: (id: string, input: SaasTenantUpdateDto, config?: RestConfig): Promise<SaasTenantDto> =>
      rest.request<SaasTenantUpdateDto, SaasTenantDto>(
        { method: 'PUT', url: `/api/saas/tenants/${encodeURIComponent(String(id))}`, body: input },
        { apiName, ...config },
      ),

    updateConnectionStrings: (
      id: string,
      input: SaasTenantConnectionStringsDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<SaasTenantConnectionStringsDto, void>(
        {
          method: 'PUT',
          url: `/api/saas/tenants/${encodeURIComponent(String(id))}/connection-strings`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type TenantService = ServiceOf<typeof TenantService>;
