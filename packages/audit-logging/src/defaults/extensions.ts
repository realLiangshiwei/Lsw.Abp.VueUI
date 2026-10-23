import { EntityAction, EntityProp, PropType, ToolbarAction } from '@lsw-abpvue/components';
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import type { AuditLogDto, EntityChangeDto } from '@lsw-abpvue/audit-logging/proxy';
import { ConfigStateService, LocalizationService } from '@lsw-abpvue/core';
import { markRaw } from 'vue';
import HttpRequestCell from '../components/HttpRequestCell.vue';
import { AuditLoggingComponents } from '../enums/components.js';
import { AUDIT_LOGS_PAGE, SHOW_ENTITY_DETAILS } from '../tokens/pages.token.js';
import { formatAuditDate } from '../utils/use-audit-logging.js';

export const DEFAULT_AUDIT_LOGGING_ENTITY_PROPS = {
  [AuditLoggingComponents.AuditLogs]: EntityProp.createMany<AuditLogDto>([
    {
      name: 'url',
      displayName: 'AbpAuditLogging::HttpRequest',
      type: PropType.String,
      sortable: true,
      columnWidth: 600,
      component: markRaw(HttpRequestCell),
    },
    {
      name: 'userName',
      displayName: 'AbpAuditLogging::User',
      type: PropType.String,
      sortable: true,
      columnWidth: 150,
    },
    {
      name: 'clientIpAddress',
      displayName: 'AbpAuditLogging::IpAddress',
      type: PropType.String,
      sortable: true,
      columnWidth: 150,
    },
    {
      name: 'executionTime',
      displayName: 'AbpIdentity::Date',
      type: PropType.DateTime,
      sortable: true,
      columnWidth: 150,
      valueResolver: data =>
        formatAuditDate(
          data.record.executionTime,
          data.getInjected(ConfigStateService).snapshot().localization.currentCulture.cultureName,
        ),
    },
    {
      name: 'executionDuration',
      displayName: 'AbpAuditLogging::Duration',
      type: PropType.Number,
      sortable: true,
      columnWidth: 150,
    },
    {
      name: 'applicationName',
      displayName: 'AbpAuditLogging::ApplicationName',
      type: PropType.String,
      sortable: true,
      columnWidth: 200,
    },
  ]),
};
export const DEFAULT_ENTITY_CHANGES_ENTITY_PROPS = EntityProp.createMany<EntityChangeDto>([
  {
    name: 'changeTime',
    displayName: 'AbpAuditLogging::Time',
    type: PropType.DateTime,
    sortable: true,
    columnWidth: 230,
    valueResolver: data =>
      formatAuditDate(
        data.record.changeTime,
        data.getInjected(ConfigStateService).snapshot().localization.currentCulture.cultureName,
      ),
  },
  {
    name: 'changeType',
    displayName: 'AbpAuditLogging::ChangeType',
    type: PropType.String,
    columnWidth: 140,
    valueResolver: data =>
      data
        .getInjected(LocalizationService)
        .t(`AbpAuditLogging::${['Created', 'Updated', 'Deleted'][data.record.changeType]}`),
  },
  {
    name: 'tenantId',
    displayName: 'AbpAuditLogging::TenantId',
    type: PropType.String,
    columnWidth: 150,
  },
  {
    name: 'entityId',
    displayName: 'AbpAuditLogging::EntityId',
    type: PropType.String,
    columnWidth: 150,
  },
  {
    name: 'entityTypeFullName',
    displayName: 'AbpAuditLogging::EntityTypeFullName',
    type: PropType.String,
    columnWidth: 150,
  },
]);
export const DEFAULT_AUDIT_LOGGING_ENTITY_ACTIONS = {
  [AuditLoggingComponents.AuditLogs]: EntityAction.createMany<AuditLogDto>([
    {
      text: 'AbpAuditLogging::Detail',
      icon: 'bi bi-eye',
      action: data => data.getInjected(AUDIT_LOGS_PAGE).openModal(data.record.id ?? ''),
    },
  ]),
  [AuditLoggingComponents.EntityChanges]: EntityAction.createMany<EntityChangeDto>([
    {
      text: 'AbpAuditLogging::ChangeDetails',
      icon: 'bi bi-search',
      action: data => data.getInjected(SHOW_ENTITY_DETAILS)(data.record.id ?? ''),
    },
    {
      text: 'AbpAuditLogging::FullChangeHistory',
      icon: 'bi bi-clock-history',
      visible: data => !!data?.record.entityId && !!data.record.entityTypeFullName,
      action: data =>
        data.getInjected(SHOW_ENTITY_HISTORY)(
          data.record.entityId ?? '',
          data.record.entityTypeFullName ?? '',
        ),
    },
  ]),
};
export const DEFAULT_AUDIT_LOGGING_TOOLBAR_ACTIONS = {
  [AuditLoggingComponents.AuditLogs]: ToolbarAction.createMany<readonly AuditLogDto[]>([]),
};
