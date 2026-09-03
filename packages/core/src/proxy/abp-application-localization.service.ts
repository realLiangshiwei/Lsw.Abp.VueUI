import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import type { RestConfig } from '../models/http.js';
import { RestService } from '../services/rest.service.js';
import type { ApplicationLocalizationDto, ApplicationLocalizationRequestDto } from './models.js';

export const AbpApplicationLocalizationService = defineService(
  'AbpApplicationLocalizationService',
  () => {
    const rest = inject(RestService);
    const apiName = 'abp';

    return {
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
