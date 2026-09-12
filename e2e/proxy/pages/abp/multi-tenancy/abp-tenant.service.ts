import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { FindTenantResultDto } from '../../../volo/abp/asp-net-core/mvc/multi-tenancy/models.js';

export const AbpTenantService = defineService('AbpTenantService', () => {
  const rest = inject(RestService);
  const apiName = 'abp';

  return {
    apiName,

    findTenantById: (id: string, config?: RestConfig): Promise<FindTenantResultDto> =>
      rest.request<never, FindTenantResultDto>(
        { method: 'GET', url: `/api/abp/multi-tenancy/tenants/by-id/${id}` },
        { apiName, ...config },
      ),

    findTenantByName: (name: string, config?: RestConfig): Promise<FindTenantResultDto> =>
      rest.request<never, FindTenantResultDto>(
        { method: 'GET', url: `/api/abp/multi-tenancy/tenants/by-name/${name}` },
        { apiName, ...config },
      ),
  };
});
export type AbpTenantService = ServiceOf<typeof AbpTenantService>;
