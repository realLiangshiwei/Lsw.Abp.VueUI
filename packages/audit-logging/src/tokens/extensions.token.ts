import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { AuditLogDto, EntityChangeDto } from '@lsw-abpvue/audit-logging/proxy';
import type { AuditLoggingComponents } from '../enums/components.js';

export type AuditLoggingEntityActionContributors = Partial<{
  [AuditLoggingComponents.AuditLogs]: EntityActionContributorCallback<AuditLogDto>[];
  [AuditLoggingComponents.EntityChanges]: EntityActionContributorCallback<EntityChangeDto>[];
}>;
export type AuditLoggingEntityPropContributors = Partial<{
  [AuditLoggingComponents.AuditLogs]: EntityPropContributorCallback<AuditLogDto>[];
}>;
export type AuditLoggingToolbarActionContributors = Partial<{
  [AuditLoggingComponents.AuditLogs]: ToolbarActionContributorCallback<readonly AuditLogDto[]>[];
}>;
export interface AuditLoggingConfigOptions {
  entityActionContributors?: AuditLoggingEntityActionContributors | undefined;
  entityPropContributors?: AuditLoggingEntityPropContributors | undefined;
  toolbarActionContributors?: AuditLoggingToolbarActionContributors | undefined;
}

export const AUDIT_LOGGING_ENTITY_ACTION_CONTRIBUTORS =
  defineToken<AuditLoggingEntityActionContributors>('AUDIT_LOGGING_ENTITY_ACTION_CONTRIBUTORS');
export const AUDIT_LOGGING_ENTITY_PROP_CONTRIBUTORS =
  defineToken<AuditLoggingEntityPropContributors>('AUDIT_LOGGING_ENTITY_PROP_CONTRIBUTORS');
export const AUDIT_LOGGING_TOOLBAR_ACTION_CONTRIBUTORS =
  defineToken<AuditLoggingToolbarActionContributors>('AUDIT_LOGGING_TOOLBAR_ACTION_CONTRIBUTORS');
