import type {
  EntityDto,
  ExtensibleEntityDto,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';
import type { EntityChangeType } from '../auditing/entity-change-type.enum.js';

export interface AuditLogActionDto extends ExtensibleEntityDto<string> {
  tenantId?: string | null | undefined;
  auditLogId: string;
  serviceName?: string | undefined;
  methodName?: string | undefined;
  parameters?: string | undefined;
  executionTime: string;
  executionDuration: number;
}

export interface AuditLogDto extends ExtensibleEntityDto<string> {
  userId?: string | null | undefined;
  userName?: string | undefined;
  tenantId?: string | null | undefined;
  tenantName?: string | undefined;
  impersonatorUserId?: string | null | undefined;
  impersonatorUserName?: string | undefined;
  impersonatorTenantId?: string | null | undefined;
  impersonatorTenantName?: string | undefined;
  executionTime: string;
  executionDuration: number;
  clientIpAddress?: string | undefined;
  clientId?: string | undefined;
  clientName?: string | undefined;
  browserInfo?: string | undefined;
  httpMethod?: string | undefined;
  url?: string | undefined;
  exceptions?: string | undefined;
  comments?: string | undefined;
  httpStatusCode?: number | null | undefined;
  applicationName?: string | undefined;
  correlationId?: string | undefined;
  entityChanges?: EntityChangeDto[] | undefined;
  actions?: AuditLogActionDto[] | undefined;
}

export interface AuditLogGlobalSettingsDto extends AuditLogSettingsDto {
  isPeriodicDeleterEnabled?: boolean | undefined;
}

export interface AuditLogSettingsDto {
  isExpiredDeleterEnabled?: boolean | undefined;
  expiredDeleterPeriod?: number | undefined;
}

export interface EntityChangeDto extends ExtensibleEntityDto<string> {
  auditLogId: string;
  tenantId?: string | null | undefined;
  changeTime: string;
  changeType: EntityChangeType;
  entityId?: string | undefined;
  entityTypeFullName?: string | undefined;
  propertyChanges?: EntityPropertyChangeDto[] | undefined;
}

export interface EntityChangeFilter {
  entityId?: string | undefined;
  entityTypeFullName?: string | undefined;
}

export interface EntityChangeWithUsernameDto {
  entityChange?: EntityChangeDto | undefined;
  userName?: string | undefined;
}

export interface EntityPropertyChangeDto extends EntityDto<string> {
  tenantId?: string | null | undefined;
  entityChangeId: string;
  newValue?: string | undefined;
  originalValue?: string | undefined;
  propertyName?: string | undefined;
  propertyTypeFullName?: string | undefined;
}

export interface ExportAuditLogsInput {
  startTime?: string | null | undefined;
  endTime?: string | null | undefined;
  url?: string | undefined;
  clientId?: string | undefined;
  userName?: string | undefined;
  applicationName?: string | undefined;
  clientIpAddress?: string | undefined;
  correlationId?: string | undefined;
  httpMethod?: string | undefined;
  httpStatusCode?: unknown | null | undefined;
  maxExecutionDuration?: number | null | undefined;
  minExecutionDuration?: number | null | undefined;
  hasException?: boolean | null | undefined;
  sorting?: string | undefined;
}

export interface ExportAuditLogsOutput {
  message?: string | undefined;
  fileData?: string | number[] | undefined;
  fileName?: string | undefined;
  isBackgroundJob: boolean;
}

export interface ExportEntityChangesInput {
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  entityChangeType?: unknown | null | undefined;
  entityId?: string | undefined;
  entityTypeFullName?: string | undefined;
  sorting?: string | undefined;
}

export interface ExportEntityChangesOutput {
  message?: string | undefined;
  fileData?: string | number[] | undefined;
  fileName?: string | undefined;
  isBackgroundJob: boolean;
}

export interface GetAuditLogListDto extends PagedAndSortedResultRequestDto {
  startTime?: string | null | undefined;
  endTime?: string | null | undefined;
  url?: string | undefined;
  clientId?: string | undefined;
  userName?: string | undefined;
  applicationName?: string | undefined;
  clientIpAddress?: string | undefined;
  correlationId?: string | undefined;
  httpMethod?: string | undefined;
  httpStatusCode?: unknown | null | undefined;
  maxExecutionDuration?: number | null | undefined;
  minExecutionDuration?: number | null | undefined;
  hasException?: boolean | null | undefined;
}

export interface GetAverageExecutionDurationPerDayInput {
  startDate?: string | undefined;
  endDate?: string | undefined;
}

export interface GetAverageExecutionDurationPerDayOutput {
  data?: Record<string, number> | undefined;
}

export interface GetEntityChangesDto extends PagedAndSortedResultRequestDto {
  auditLogId?: string | null | undefined;
  entityChangeType?: unknown | null | undefined;
  entityId?: string | undefined;
  entityTypeFullName?: string | undefined;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
}

export interface GetErrorRateFilter {
  startDate?: string | undefined;
  endDate?: string | undefined;
}

export interface GetErrorRateOutput {
  data?: Record<string, number> | undefined;
}
