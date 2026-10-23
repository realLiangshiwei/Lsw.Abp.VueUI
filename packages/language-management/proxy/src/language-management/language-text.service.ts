import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { GetLanguagesTextsInput, LanguageTextDto } from './dto/models.js';

export const LanguageTextService = defineService('LanguageTextService', () => {
  const rest = inject(RestService);
  const apiName = 'LanguageManagement';

  return {
    apiName,

    get: (
      resourceName: string,
      cultureName: string,
      name: string,
      baseCultureName: string,
      config?: RestConfig,
    ): Promise<LanguageTextDto> =>
      rest.request<never, LanguageTextDto>(
        {
          method: 'GET',
          url: `/api/language-management/language-texts/${encodeURIComponent(String(resourceName))}/${encodeURIComponent(String(cultureName))}/${encodeURIComponent(String(name))}`,
          params: { baseCultureName },
        },
        { apiName, ...config },
      ),

    getList: (
      input: GetLanguagesTextsInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<LanguageTextDto>> =>
      rest.request<never, PagedResultDto<LanguageTextDto>>(
        {
          method: 'GET',
          url: '/api/language-management/language-texts',
          params: {
            filter: input.filter,
            resourceName: input.resourceName,
            baseCultureName: input.baseCultureName,
            targetCultureName: input.targetCultureName,
            getOnlyEmptyValues: input.getOnlyEmptyValues,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    restoreToDefault: (
      resourceName: string,
      cultureName: string,
      name: string,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/language-management/language-texts/${encodeURIComponent(String(resourceName))}/${encodeURIComponent(String(cultureName))}/${encodeURIComponent(String(name))}/restore`,
        },
        { apiName, ...config },
      ),

    update: (
      resourceName: string,
      cultureName: string,
      name: string,
      value: string,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/language-management/language-texts/${encodeURIComponent(String(resourceName))}/${encodeURIComponent(String(cultureName))}/${encodeURIComponent(String(name))}`,
          params: { value },
        },
        { apiName, ...config },
      ),
  };
});
export type LanguageTextService = ServiceOf<typeof LanguageTextService>;
