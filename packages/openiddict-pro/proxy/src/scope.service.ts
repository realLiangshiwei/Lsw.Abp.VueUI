import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  CreateScopeInput,
  GetScopeListInput,
  ScopeDto,
  UpdateScopeInput,
} from './scopes/dtos/models.js';

export const ScopeService = defineService('ScopeService', () => {
  const rest = inject(RestService);
  const apiName = 'OpenIddictPro';

  return {
    apiName,

    create: (input: CreateScopeInput, config?: RestConfig): Promise<ScopeDto> =>
      rest.request<CreateScopeInput, ScopeDto>(
        { method: 'POST', url: '/api/openiddict/scopes', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: '/api/openiddict/scopes', params: { id } },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<ScopeDto> =>
      rest.request<never, ScopeDto>(
        { method: 'GET', url: `/api/openiddict/scopes/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getAllScopes: (config?: RestConfig): Promise<ScopeDto[]> =>
      rest.request<never, ScopeDto[]>(
        { method: 'GET', url: '/api/openiddict/scopes/all' },
        { apiName, ...config },
      ),

    getList: (input: GetScopeListInput, config?: RestConfig): Promise<PagedResultDto<ScopeDto>> =>
      rest.request<never, PagedResultDto<ScopeDto>>(
        {
          method: 'GET',
          url: '/api/openiddict/scopes',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    update: (id: string, input: UpdateScopeInput, config?: RestConfig): Promise<ScopeDto> =>
      rest.request<UpdateScopeInput, ScopeDto>(
        {
          method: 'PUT',
          url: `/api/openiddict/scopes/${encodeURIComponent(String(id))}`,
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type ScopeService = ServiceOf<typeof ScopeService>;
