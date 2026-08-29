import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { RestConfig } from '../models/http';
import { RestService } from '../services/rest.service';
import type { FindTenantResultDto } from './models';

export const AbpTenantService = defineService('AbpTenantService', () => {
  const rest = inject(RestService);
  const apiName = 'abp';

  return {
    findTenantByName: (name: string, config?: RestConfig): Promise<FindTenantResultDto> =>
      rest.request<never, FindTenantResultDto>(
        { method: 'GET', url: `/api/abp/multi-tenancy/tenants/by-name/${name}` },
        { apiName, ...config },
      ),

    findTenantById: (id: string, config?: RestConfig): Promise<FindTenantResultDto> =>
      rest.request<never, FindTenantResultDto>(
        { method: 'GET', url: `/api/abp/multi-tenancy/tenants/by-id/${id}` },
        { apiName, ...config },
      ),
  };
});
export type AbpTenantService = ServiceOf<typeof AbpTenantService>;
