import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { PlanDto } from '../../payment/plans/models.js';
import type {
  EditionCreateDto,
  EditionDto,
  EditionUpdateDto,
  GetEditionsInput,
} from './dtos/models.js';
import type { GetEditionUsageStatisticsResultDto } from './models.js';

export const EditionService = defineService('EditionService', () => {
  const rest = inject(RestService);
  const apiName = 'SaasHost';

  return {
    apiName,

    create: (input: EditionCreateDto, config?: RestConfig): Promise<EditionDto> =>
      rest.request<EditionCreateDto, EditionDto>(
        { method: 'POST', url: '/api/saas/editions', body: input },
        { apiName, ...config },
      ),

    delete: (id: string, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: `/api/saas/editions/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<EditionDto> =>
      rest.request<never, EditionDto>(
        { method: 'GET', url: `/api/saas/editions/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getAllList: (config?: RestConfig): Promise<EditionDto[]> =>
      rest.request<never, EditionDto[]>(
        { method: 'GET', url: '/api/saas/editions/all' },
        { apiName, ...config },
      ),

    getList: (input: GetEditionsInput, config?: RestConfig): Promise<PagedResultDto<EditionDto>> =>
      rest.request<never, PagedResultDto<EditionDto>>(
        {
          method: 'GET',
          url: '/api/saas/editions',
          params: {
            filter: input.filter,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    getPlanLookup: (config?: RestConfig): Promise<PlanDto[]> =>
      rest.request<never, PlanDto[]>(
        { method: 'GET', url: '/api/saas/editions/plan-lookup' },
        { apiName, ...config },
      ),

    getUsageStatistics: (config?: RestConfig): Promise<GetEditionUsageStatisticsResultDto> =>
      rest.request<never, GetEditionUsageStatisticsResultDto>(
        { method: 'GET', url: '/api/saas/editions/statistics/usage-statistic' },
        { apiName, ...config },
      ),

    moveAllTenants: (id: string, editionId: string | null, config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'PUT',
          url: `/api/saas/editions/${encodeURIComponent(String(id))}/move-all-tenants`,
          params: { editionId },
        },
        { apiName, ...config },
      ),

    update: (id: string, input: EditionUpdateDto, config?: RestConfig): Promise<EditionDto> =>
      rest.request<EditionUpdateDto, EditionDto>(
        { method: 'PUT', url: `/api/saas/editions/${encodeURIComponent(String(id))}`, body: input },
        { apiName, ...config },
      ),
  };
});
export type EditionService = ServiceOf<typeof EditionService>;
