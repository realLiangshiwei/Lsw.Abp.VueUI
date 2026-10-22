import { defineService, inject, RestService } from '../../../../proxy-core.js';
import type { RestConfig, ServiceOf } from '../../../../proxy-core.js';
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
