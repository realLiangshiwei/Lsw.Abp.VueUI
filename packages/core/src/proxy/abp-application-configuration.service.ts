import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { RestConfig } from '../models/http';
import { RestService } from '../services/rest.service';
import type { ApplicationConfigurationDto, ApplicationConfigurationRequestOptions } from './models';

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
