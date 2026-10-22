import { defineService, inject, RestService } from '@lsw-abpvue/core';
import type { PagedResultDto, RestConfig, ServiceOf } from '@lsw-abpvue/core';
import type {
  AuditLogDto,
  EntityChangeDto,
  EntityChangeFilter,
  EntityChangeWithUsernameDto,
  ExportAuditLogsInput,
  ExportAuditLogsOutput,
  ExportEntityChangesInput,
  ExportEntityChangesOutput,
  GetAuditLogListDto,
  GetAverageExecutionDurationPerDayInput,
  GetAverageExecutionDurationPerDayOutput,
  GetEntityChangesDto,
  GetErrorRateFilter,
  GetErrorRateOutput,
} from './models.js';

export const AuditLogsService = defineService('AuditLogsService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpAuditLogging';

  return {
    apiName,

    downloadExcel: (fileName: string, config?: RestConfig): Promise<Blob> =>
      rest.request<never, Blob>(
        {
          method: 'GET',
          responseType: 'blob',
          url: `/api/audit-logging/audit-logs/download-excel/${encodeURIComponent(String(fileName))}`,
        },
        { apiName, ...config },
      ),

    exportEntityChangesToExcel: (
      input: ExportEntityChangesInput,
      config?: RestConfig,
    ): Promise<ExportEntityChangesOutput> =>
      rest.request<never, ExportEntityChangesOutput>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs/export-entity-changes-to-excel',
          params: {
            startDate: input.startDate,
            endDate: input.endDate,
            entityChangeType: input.entityChangeType,
            entityId: input.entityId,
            entityTypeFullName: input.entityTypeFullName,
            sorting: input.sorting,
          },
        },
        { apiName, ...config },
      ),

    exportToExcel: (
      input: ExportAuditLogsInput,
      config?: RestConfig,
    ): Promise<ExportAuditLogsOutput> =>
      rest.request<never, ExportAuditLogsOutput>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs/export-to-excel',
          params: {
            startTime: input.startTime,
            endTime: input.endTime,
            url: input.url,
            clientId: input.clientId,
            userName: input.userName,
            applicationName: input.applicationName,
            clientIpAddress: input.clientIpAddress,
            correlationId: input.correlationId,
            httpMethod: input.httpMethod,
            httpStatusCode: input.httpStatusCode,
            maxExecutionDuration: input.maxExecutionDuration,
            minExecutionDuration: input.minExecutionDuration,
            hasException: input.hasException,
            sorting: input.sorting,
          },
        },
        { apiName, ...config },
      ),

    get: (id: string, config?: RestConfig): Promise<AuditLogDto> =>
      rest.request<never, AuditLogDto>(
        { method: 'GET', url: `/api/audit-logging/audit-logs/${encodeURIComponent(String(id))}` },
        { apiName, ...config },
      ),

    getAverageExecutionDurationPerDay: (
      filter: GetAverageExecutionDurationPerDayInput,
      config?: RestConfig,
    ): Promise<GetAverageExecutionDurationPerDayOutput> =>
      rest.request<never, GetAverageExecutionDurationPerDayOutput>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs/statistics/average-execution-duration-per-day',
          params: { startDate: filter.startDate, endDate: filter.endDate },
        },
        { apiName, ...config },
      ),

    getEntityChange: (entityChangeId: string, config?: RestConfig): Promise<EntityChangeDto> =>
      rest.request<never, EntityChangeDto>(
        {
          method: 'GET',
          url: `/api/audit-logging/audit-logs/entity-changes/${encodeURIComponent(String(entityChangeId))}`,
        },
        { apiName, ...config },
      ),

    getEntityChangeWithUsername: (
      entityChangeId: string,
      config?: RestConfig,
    ): Promise<EntityChangeWithUsernameDto> =>
      rest.request<never, EntityChangeWithUsernameDto>(
        {
          method: 'GET',
          url: `/api/audit-logging/audit-logs/entity-change-with-username/${encodeURIComponent(String(entityChangeId))}`,
        },
        { apiName, ...config },
      ),

    getEntityChanges: (
      input: GetEntityChangesDto,
      config?: RestConfig,
    ): Promise<PagedResultDto<EntityChangeDto>> =>
      rest.request<never, PagedResultDto<EntityChangeDto>>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs/entity-changes',
          params: {
            auditLogId: input.auditLogId,
            entityChangeType: input.entityChangeType,
            entityId: input.entityId,
            entityTypeFullName: input.entityTypeFullName,
            startDate: input.startDate,
            endDate: input.endDate,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),

    getEntityChangesWithUsername: (
      input: EntityChangeFilter,
      config?: RestConfig,
    ): Promise<EntityChangeWithUsernameDto[]> =>
      rest.request<never, EntityChangeWithUsernameDto[]>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs/entity-changes-with-username',
          params: { entityId: input.entityId, entityTypeFullName: input.entityTypeFullName },
        },
        { apiName, ...config },
      ),

    getErrorRate: (filter: GetErrorRateFilter, config?: RestConfig): Promise<GetErrorRateOutput> =>
      rest.request<never, GetErrorRateOutput>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs/statistics/error-rate',
          params: { startDate: filter.startDate, endDate: filter.endDate },
        },
        { apiName, ...config },
      ),

    getList: (
      input: GetAuditLogListDto,
      config?: RestConfig,
    ): Promise<PagedResultDto<AuditLogDto>> =>
      rest.request<never, PagedResultDto<AuditLogDto>>(
        {
          method: 'GET',
          url: '/api/audit-logging/audit-logs',
          params: {
            startTime: input.startTime,
            endTime: input.endTime,
            url: input.url,
            clientId: input.clientId,
            userName: input.userName,
            applicationName: input.applicationName,
            clientIpAddress: input.clientIpAddress,
            correlationId: input.correlationId,
            httpMethod: input.httpMethod,
            httpStatusCode: input.httpStatusCode,
            maxExecutionDuration: input.maxExecutionDuration,
            minExecutionDuration: input.minExecutionDuration,
            hasException: input.hasException,
            sorting: input.sorting,
            skipCount: input.skipCount,
            maxResultCount: input.maxResultCount,
          },
        },
        { apiName, ...config },
      ),
  };
});
export type AuditLogsService = ServiceOf<typeof AuditLogsService>;
