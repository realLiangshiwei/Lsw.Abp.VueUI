import { defineService, inject, RestService } from '../../../../proxy-core.js';
import type { RestConfig, ServiceOf } from '../../../../proxy-core.js';
import type { FindTenantResultDto } from '../../../asp-net-core/mvc/multi-tenancy/models.js';

export const AbpTenantService = defineService('AbpTenantService', () => {
  const rest = inject(RestService);
  const apiName = 'abp';

  return {
    apiName,

    findTenantById: (id: string, config?: RestConfig): Promise<FindTenantResultDto> =>
      rest.request<never, FindTenantResultDto>(
        {
          method: 'GET',
          url: `/api/abp/multi-tenancy/tenants/by-id/${encodeURIComponent(String(id))}`,
        },
        { apiName, ...config },
      ),

    findTenantByName: (name: string, config?: RestConfig): Promise<FindTenantResultDto> =>
      rest.request<never, FindTenantResultDto>(
        {
          method: 'GET',
          url: `/api/abp/multi-tenancy/tenants/by-name/${encodeURIComponent(String(name))}`,
        },
        { apiName, ...config },
      ),
  };
});
export type AbpTenantService = ServiceOf<typeof AbpTenantService>;
