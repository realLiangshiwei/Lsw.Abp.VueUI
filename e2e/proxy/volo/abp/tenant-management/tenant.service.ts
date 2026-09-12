import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { GetTenantsInput, TenantCreateDto, TenantDto, TenantUpdateDto } from './models.js';

export const TenantService = defineService('TenantService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpTenantManagement';

  return {
    apiName,

    create: (input: TenantCreateDto, config?: RestConfig): Promise<TenantDto> =>
      rest.request<TenantCreateDto, TenantDto>(
        { method: 'POST', url: '/api/multi-tenancy/tenants', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/multi-tenancy/tenants/${id}` },
        { apiName, ...config },
      ),

    deleteDefaultConnectionString: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/multi-tenancy/tenants/${id}/default-connection-string` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<TenantDto> =>
      rest.request<never, TenantDto>(
        { method: 'GET', url: `/api/multi-tenancy/tenants/${id}` },
        { apiName, ...config },
      ),

    getDefaultConnectionString: (id: string, config?: RestConfig): Promise<string> =>
      rest.request<never, string>(
        {
          method: 'GET',
          responseType: 'text',
          url: `/api/multi-tenancy/tenants/${id}/default-connection-string`,
        },
        { apiName, ...config },
      ),

    getList: (input: GetTenantsInput, config?: RestConfig): Promise<PagedResultDto<TenantDto>> =>
      rest.request<never, PagedResultDto<TenantDto>>(
        {
          method: 'GET',
          url: '/api/multi-tenancy/tenants',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    update: (id: string, input: TenantUpdateDto, config?: RestConfig): Promise<TenantDto> =>
      rest.request<TenantUpdateDto, TenantDto>(
        { method: 'PUT', url: `/api/multi-tenancy/tenants/${id}`, body: input },
        { apiName, ...config },
      ),

    updateDefaultConnectionString: (
      id: string,
      defaultConnectionString: string,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/multi-tenancy/tenants/${id}/default-connection-string`,
          params: { defaultConnectionString },
        },
        { apiName, ...config },
      ),
  };
});
export type TenantService = ServiceOf<typeof TenantService>;
