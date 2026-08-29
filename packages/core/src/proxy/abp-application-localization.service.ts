import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { RestConfig } from '../models/http';
import { RestService } from '../services/rest.service';
import type { ApplicationLocalizationDto, ApplicationLocalizationRequestDto } from './models';

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
