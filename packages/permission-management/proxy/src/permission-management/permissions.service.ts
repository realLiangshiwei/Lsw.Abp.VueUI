import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  GetPermissionListResultDto,
  GetResourcePermissionDefinitionListResultDto,
  GetResourcePermissionListResultDto,
  GetResourcePermissionWithProviderListResultDto,
  GetResourceProviderListResultDto,
  SearchProviderKeyListResultDto,
  UpdatePermissionsDto,
  UpdateResourcePermissionsDto,
} from './models.js';

export const PermissionsService = defineService('PermissionsService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpPermissionManagement';

  return {
    apiName,

    deleteResource: (
      resourceName: string,
      resourceKey: string,
      providerName: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<never, void>(
        {
          method: 'DELETE',
          url: '/api/permission-management/permissions/resource',
          params: { resourceName, resourceKey, providerName, providerKey },
        },
        { apiName, ...config },
      ),

    get: (
      providerName: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<GetPermissionListResultDto> =>
      rest.request<never, GetPermissionListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions',
          params: { providerName, providerKey },
        },
        { apiName, ...config },
      ),

    getByGroup: (
      groupName: string,
      providerName: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<GetPermissionListResultDto> =>
      rest.request<never, GetPermissionListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions/by-group',
          params: { groupName, providerName, providerKey },
        },
        { apiName, ...config },
      ),

    getResource: (
      resourceName: string,
      resourceKey: string,
      config?: RestConfig,
    ): Promise<GetResourcePermissionListResultDto> =>
      rest.request<never, GetResourcePermissionListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions/resource',
          params: { resourceName, resourceKey },
        },
        { apiName, ...config },
      ),

    getResourceByProvider: (
      resourceName: string,
      resourceKey: string,
      providerName: string,
      providerKey: string,
      config?: RestConfig,
    ): Promise<GetResourcePermissionWithProviderListResultDto> =>
      rest.request<never, GetResourcePermissionWithProviderListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions/resource/by-provider',
          params: { resourceName, resourceKey, providerName, providerKey },
        },
        { apiName, ...config },
      ),

    getResourceDefinitions: (
      resourceName: string,
      config?: RestConfig,
    ): Promise<GetResourcePermissionDefinitionListResultDto> =>
      rest.request<never, GetResourcePermissionDefinitionListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions/resource-definitions',
          params: { resourceName },
        },
        { apiName, ...config },
      ),

    getResourceProviderKeyLookupServices: (
      resourceName: string,
      config?: RestConfig,
    ): Promise<GetResourceProviderListResultDto> =>
      rest.request<never, GetResourceProviderListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions/resource-provider-key-lookup-services',
          params: { resourceName },
        },
        { apiName, ...config },
      ),

    searchResourceProviderKey: (
      resourceName: string,
      serviceName: string,
      filter: string,
      page: number,
      config?: RestConfig,
    ): Promise<SearchProviderKeyListResultDto> =>
      rest.request<never, SearchProviderKeyListResultDto>(
        {
          method: 'GET',
          url: '/api/permission-management/permissions/search-resource-provider-keys',
          params: { resourceName, serviceName, filter, page },
        },
        { apiName, ...config },
      ),

    update: (
      providerName: string,
      providerKey: string,
      input: UpdatePermissionsDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<UpdatePermissionsDto, void>(
        {
          method: 'PUT',
          url: '/api/permission-management/permissions',
          params: { providerName, providerKey },
          body: input,
        },
        { apiName, ...config },
      ),

    updateResource: (
      resourceName: string,
      resourceKey: string,
      input: UpdateResourcePermissionsDto,
      config?: RestConfig,
    ): Promise<void> =>
      rest.request<UpdateResourcePermissionsDto, void>(
        {
          method: 'PUT',
          url: '/api/permission-management/permissions/resource',
          params: { resourceName, resourceKey },
          body: input,
        },
        { apiName, ...config },
      ),
  };
});
export type PermissionsService = ServiceOf<typeof PermissionsService>;
