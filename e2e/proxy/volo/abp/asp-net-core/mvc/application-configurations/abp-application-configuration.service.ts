import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  ApplicationConfigurationDto,
  ApplicationConfigurationRequestOptions,
} from './models.js';

export const AbpApplicationConfigurationService = defineService(
  'AbpApplicationConfigurationService',
  () => {
    const rest = inject(RestService);
    const apiName = 'abp';

    return {
      apiName,

      get: (
        options: ApplicationConfigurationRequestOptions,
        config?: RestConfig,
      ): Promise<ApplicationConfigurationDto> =>
        rest.request<never, ApplicationConfigurationDto>(
          {
            method: 'GET',
            url: '/api/abp/application-configuration',
            params: { includeLocalizationResources: options.includeLocalizationResources },
          },
          { apiName, ...config },
        ),
    };
  },
);
export type AbpApplicationConfigurationService = ServiceOf<
  typeof AbpApplicationConfigurationService
>;
