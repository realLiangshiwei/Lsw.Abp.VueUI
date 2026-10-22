import { defineService, inject, RestService } from '../../../../proxy-core.js';
import type { RestConfig, ServiceOf } from '../../../../proxy-core.js';
import type {
  ApplicationApiDescriptionModel,
  ApplicationApiDescriptionModelRequestDto,
} from '../../../http/modeling/models.js';

export const AbpApiDefinitionService = defineService('AbpApiDefinitionService', () => {
  const rest = inject(RestService);
  const apiName = 'abp';

  return {
    apiName,

    getByModel: (
      model: ApplicationApiDescriptionModelRequestDto,
      config?: RestConfig,
    ): Promise<ApplicationApiDescriptionModel> =>
      rest.request<never, ApplicationApiDescriptionModel>(
        {
          method: 'GET',
          url: '/api/abp/api-definition',
          params: {
            includeTypes: model.includeTypes,
            includeDescriptions: model.includeDescriptions,
          },
        },
        { apiName, ...config },
      ),
  };
});
export type AbpApiDefinitionService = ServiceOf<typeof AbpApiDefinitionService>;
