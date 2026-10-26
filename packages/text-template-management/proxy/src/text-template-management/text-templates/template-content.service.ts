import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  GetTemplateContentInput,
  RestoreTemplateContentInput,
  TextTemplateContentDto,
  UpdateTemplateContentInput,
} from './models.js';

export const TemplateContentService = defineService('TemplateContentService', () => {
  const rest = inject(RestService);
  const apiName = 'TextTemplateManagement';

  return {
    apiName,

    get: (input: GetTemplateContentInput, config?: RestConfig): Promise<TextTemplateContentDto> =>
      rest.request<never, TextTemplateContentDto>(
        {
          method: 'GET',
          url: '/api/text-template-management/template-contents',
          params: { templateName: input.templateName, cultureName: input.cultureName },
        },
        { apiName, ...config },
      ),

    restoreToDefault: (input: RestoreTemplateContentInput, config?: RestConfig): Promise<void> =>
      rest.request<RestoreTemplateContentInput, void>(
        {
          method: 'PUT',
          url: '/api/text-template-management/template-contents/restore-to-default',
          body: input,
        },
        { apiName, ...config },
      ),

    update: (
      input: UpdateTemplateContentInput,
      config?: RestConfig,
    ): Promise<TextTemplateContentDto> =>
      rest.request<UpdateTemplateContentInput, TextTemplateContentDto>(
        { method: 'PUT', url: '/api/text-template-management/template-contents', body: input },
        { apiName, ...config },
      ),
  };
});
export type TemplateContentService = ServiceOf<typeof TemplateContentService>;
