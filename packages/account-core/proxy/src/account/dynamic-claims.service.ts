import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';

export const DynamicClaimsService = defineService('DynamicClaimsService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAccount';

  return {
    apiName,

    refresh: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/account/dynamic-claims/refresh' },
        { apiName, ...config },
      ),
  };
});
export type DynamicClaimsService = ServiceOf<typeof DynamicClaimsService>;
