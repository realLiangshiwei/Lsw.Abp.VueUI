import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  ApplicationDto,
  ApplicationTokenLifetimeDto,
  CreateApplicationInput,
  GenerateAccessTokenDto,
  GenerateAccessTokenInput,
  GetApplicationListInput,
  UpdateApplicationInput,
} from './applications/dtos/models.js';

export const ApplicationService = defineService('ApplicationService', () => {
  const rest = inject(RestService);
  const apiName = 'OpenIddictPro';

  return {
    apiName,

    create: (input: CreateApplicationInput, config?: RestConfig): Promise<ApplicationDto> =>
      rest.request<CreateApplicationInput, ApplicationDto>(
        { method: 'POST', url: '/api/openiddict/applications', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: '/api/openiddict/applications', params: { id } },
        { apiName, ...config },
      ),

    generateAccessToken: (
      id: string,
      input: GenerateAccessTokenInput,
      config?: RestConfig,
    ): Promise<GenerateAccessTokenDto> =>
      rest.request<GenerateAccessTokenInput, GenerateAccessTokenDto>(
        {
          method: 'POST',
          url: `/api/openiddict/applications/${encodeURIComponent(String(id))}/generate-access-token`,
          body: input,
        },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<ApplicationDto> =>
      rest.request<never, ApplicationDto>(
        { method: 'GET', url: `/api/openiddict/applications/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getList: (
      input: GetApplicationListInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<ApplicationDto>> =>
      rest.request<never, PagedResultDto<ApplicationDto>>(
        {
          method: 'GET',
          url: '/api/openiddict/applications',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    getTokenLifetime: (id: string, config?: RestConfig): Promise<ApplicationTokenLifetimeDto> =>
      rest.request<never, ApplicationTokenLifetimeDto>(
        {
          method: 'GET',
          url: `/api/openiddict/applications/${encodeURIComponent(String(id))}/token-lifetime`,
        },
        { apiName, ...config },
      ),

    setTokenLifetime: (
      id: string,
      input: ApplicationTokenLifetimeDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<ApplicationTokenLifetimeDto, void>(
        {
          method: 'PUT',
          url: `/api/openiddict/applications/${encodeURIComponent(String(id))}/token-lifetime`,
          body: input,
        },
        { apiName, ...config },
      ),

    update: (
      id: string,
      input: UpdateApplicationInput,
      config?: RestConfig,
    ): Promise<ApplicationDto> =>
      rest.request<UpdateApplicationInput, ApplicationDto>(
        {
          method: 'PUT',
          url: `/api/openiddict/applications/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type ApplicationService = ServiceOf<typeof ApplicationService>;
