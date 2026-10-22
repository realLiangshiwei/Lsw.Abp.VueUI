import { defineService, inject, RestService } from '../../../../proxy-core.js';
import type { RestConfig, ServiceOf } from '../../../../proxy-core.js';
import type { ApplicationLocalizationDto, ApplicationLocalizationRequestDto } from './models.js';

export const AbpApplicationLocalizationService = defineService(
  'AbpApplicationLocalizationService',
  () => {
    const rest = inject(RestService);
    const apiName = 'abp';

    return {
      apiName,

      get: (
        input: ApplicationLocalizationRequestDto,
        config?: RestConfig,
      ): Promise<ApplicationLocalizationDto> =>
        rest.request<never, ApplicationLocalizationDto>(
          {
            method: 'GET',
            url: '/api/abp/application-localization',
            params: { cultureName: input.cultureName, onlyDynamics: input.onlyDynamics },
          },
          { apiName, ...config },
        ),
    };
  },
);
export type AbpApplicationLocalizationService = ServiceOf<typeof AbpApplicationLocalizationService>;
