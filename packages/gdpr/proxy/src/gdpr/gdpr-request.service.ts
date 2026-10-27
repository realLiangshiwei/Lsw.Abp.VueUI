import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type { DownloadTokenResultDto, GdprRequestDto, GdprRequestInput } from './models.js';

export const GdprRequestService = defineService('GdprRequestService', () => {
  const rest = inject(RestService);
  const apiName = 'Gdpr';

  return {
    apiName,

    deleteUserData: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'DELETE', url: '/api/gdpr/requests' },
        { apiName, ...config },
      ),

    getDownloadToken: (id: string, config?: RestConfig): Promise<DownloadTokenResultDto> =>
      rest.request<never, DownloadTokenResultDto>(
        { method: 'GET', url: '/api/gdpr/requests/download-token', params: { id } },
        { apiName, ...config },
      ),

    getList: (
      input: GdprRequestInput,
      config?: RestConfig,
    ): Promise<PagedResultDto<GdprRequestDto>> =>
      rest.request<never, PagedResultDto<GdprRequestDto>>(
        {
          method: 'GET',
          url: '/api/gdpr/requests/list',
          params: {
            userId: input.userId,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    getUserData: (requestId: string, token: string, config?: RestConfig): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: `/api/gdpr/requests/data/${encodeURIComponent(String(requestId))}`,
          params: { token },
        },
        { apiName, ...config },
      ),

    isNewRequestAllowed: (config?: RestConfig): Promise<boolean> =>
      rest.request<never, boolean>(
        { method: 'GET', url: '/api/gdpr/requests/is-request-allowed' },
        { apiName, ...config },
      ),

    prepareUserData: (config?: RestConfig): Promise<void> =>
      rest.request<never, void>(
        { method: 'POST', url: '/api/gdpr/requests/prepare-data' },
        { apiName, ...config },
      ),
  };
});
export type GdprRequestService = ServiceOf<typeof GdprRequestService>;
