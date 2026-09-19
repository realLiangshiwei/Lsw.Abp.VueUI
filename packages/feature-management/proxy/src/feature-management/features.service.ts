import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { GetFeatureListResultDto, UpdateFeaturesDto } from './models.js';

export const FeaturesService = defineService('FeaturesService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpFeatureManagement';

  return {
    apiName,

    delete: (providerName: string, providerKey: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: '/api/feature-management/features',
          params: { providerName, providerKey },
        },
        { apiName, ...config },
      ),

    get: (
      providerName: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<GetFeatureListResultDto> =>
      rest.request<never, GetFeatureListResultDto>(
        {
          method: 'GET',
          url: '/api/feature-management/features',
          params: { providerName, providerKey },
        },
        { apiName, ...config },
      ),

    update: (
      providerName: string,
      providerKey: string,
      input: UpdateFeaturesDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<UpdateFeaturesDto, void>(
        {
          method: 'PUT',
          url: '/api/feature-management/features',
          params: { providerName, providerKey },
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type FeaturesService = ServiceOf<typeof FeaturesService>;
