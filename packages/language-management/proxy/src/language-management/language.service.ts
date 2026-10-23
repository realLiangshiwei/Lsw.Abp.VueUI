import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { ListResultDto, PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  CreateLanguageDto,
  CultureInfoDto,
  GetLanguagesTextsInput,
  LanguageDto,
  LanguageResourceDto,
  UpdateLanguageDto,
} from './dto/models.js';

export const LanguageService = defineService('LanguageService', () => {
  const rest = inject(RestService);
  const apiName = 'LanguageManagement';

  return {
    apiName,

    create: (input: CreateLanguageDto, config?: RestConfig): Promise<LanguageDto> =>
      rest.request<CreateLanguageDto, LanguageDto>(
        { method: 'POST', url: '/api/language-management/languages', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: `/api/language-management/languages/${encodeURIComponent(String(id))}`,
        },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<LanguageDto> =>
      rest.request<never, LanguageDto>(
        {
          method: 'GET',
          url: `/api/language-management/languages/${encodeURIComponent(String(id))}`,
        },
        { apiName, ...config },
      ),

    getAllList: (config?: RestConfig): Promise<ListResultDto<LanguageDto>> =>
      rest.request<never, ListResultDto<LanguageDto>>(
        { method: 'GET', url: '/api/language-management/languages/all' },
        { apiName, ...config },
      ),

    getCulturelist: (config?: RestConfig): Promise<CultureInfoDto[]> =>
      rest.request<never, CultureInfoDto[]>(
        { method: 'GET', url: '/api/language-management/languages/culture-list' },
        { apiName, ...config },
      ),

    getList: (
      input: GetLanguagesTextsInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<LanguageDto>> =>
      rest.request<never, PagedResultDto<LanguageDto>>(
        {
          method: 'GET',
          url: '/api/language-management/languages',
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

    getResources: (config?: RestConfig): Promise<LanguageResourceDto[]> =>
      rest.request<never, LanguageResourceDto[]>(
        { method: 'GET', url: '/api/language-management/languages/resources' },
        { apiName, ...config },
      ),

    setAsDefault: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/language-management/languages/${encodeURIComponent(String(id))}/set-as-default`,
        },
        { apiName, ...config },
      ),

    update: (id: string, input: UpdateLanguageDto, config?: RestConfig): Promise<LanguageDto> =>
      rest.request<UpdateLanguageDto, LanguageDto>(
        {
          method: 'PUT',
          url: `/api/language-management/languages/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type LanguageService = ServiceOf<typeof LanguageService>;
