import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  ExternalProviderDto,
  ExternalProviderItemWithSecretDto,
  GetByNameInput,
} from './external-providers/models.js';

export const AccountExternalProviderService = defineService(
  'AccountExternalProviderService',
  () => {
    const rest = inject(RestService);
    const apiName = 'AbpAccountPublic';

    return {
      apiName,

      getAll: (config?: RestConfig): Promise<ExternalProviderDto> =>
        rest.request<never, ExternalProviderDto>(
          { method: 'GET', url: '/api/account/external-provider' },
          { apiName, ...config },
        ),

      getByName: (
        input: GetByNameInput,
        config?: RestConfig,
      ): Promise<ExternalProviderItemWithSecretDto> =>
        rest.request<never, ExternalProviderItemWithSecretDto>(
          {
            method: 'GET',
            url: '/api/account/external-provider/by-name',
            params: { tenantId: input.tenantId, name: input.name },
          },
          { apiName, ...config },
        ),
    };
  },
);
export type AccountExternalProviderService = ServiceOf<typeof AccountExternalProviderService>;
