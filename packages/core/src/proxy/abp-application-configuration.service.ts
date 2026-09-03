import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import type { RestConfig } from '../models/http.js';
import { RestService } from '../services/rest.service.js';
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
