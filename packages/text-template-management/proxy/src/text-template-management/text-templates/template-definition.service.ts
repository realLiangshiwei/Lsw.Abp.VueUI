import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { GetTemplateDefinitionListInput, TemplateDefinitionDto } from './models.js';

export const TemplateDefinitionService = defineService('TemplateDefinitionService', () => {
  const rest = inject(RestService);
  const apiName = 'TextTemplateManagement';

  return {
    apiName,

    get: (name: string, config?: RestConfig): Promise<TemplateDefinitionDto> =>
      rest.request<never, TemplateDefinitionDto>(
        {
          method: 'GET',
          url: `/api/text-template-management/template-definitions/${encodeURIComponent(String(name))}`,
        },
        { apiName, ...config },
      ),

    getList: (
      input: GetTemplateDefinitionListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<TemplateDefinitionDto>> =>
      rest.request<never, PagedResultDto<TemplateDefinitionDto>>(
        {
          method: 'GET',
          url: '/api/text-template-management/template-definitions',
          params: {
            filterText: input.filterText,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),
  };
});
export type TemplateDefinitionService = ServiceOf<typeof TemplateDefinitionService>;
