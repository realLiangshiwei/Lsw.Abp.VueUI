import { EntityAction, EntityProp, PropType, ToolbarAction } from '@lsw-abpvue/components';
import { ConfigStateService } from '@lsw-abpvue/core';
import type { IdentitySecurityLogDto } from '@lsw-abpvue/account-pro/proxy';
import { ACCOUNT_PRO_SECURITY_LOGS_PAGE } from '../tokens/config-options.token.js';

export const DEFAULT_MY_SECURITY_LOGS_ENTITY_PROPS = EntityProp.createMany<IdentitySecurityLogDto>([
  {
    name: 'creationTime',
    displayName: 'AbpAccount::MySecurityLogs:Time',
    type: PropType.DateTime,
    sortable: true,
    valueResolver: data =>
      new Date(data.record.creationTime).toLocaleString(
        data.getInjected(ConfigStateService).snapshot().localization.currentCulture.cultureName,
      ),
  },
  {
    name: 'action',
    displayName: 'AbpAccount::MySecurityLogs:Action',
    type: PropType.String,
    sortable: true,
    action: data =>
      data.getInjected(ACCOUNT_PRO_SECURITY_LOGS_PAGE).filterAction(data.record.action),
  },
  {
    name: 'clientIpAddress',
    displayName: 'AbpAccount::MySecurityLogs:IpAddress',
    type: PropType.String,
  },
  { name: 'browserInfo', displayName: 'AbpAccount::MySecurityLogs:Browser', type: PropType.String },
  {
    name: 'applicationName',
    displayName: 'AbpAccount::MySecurityLogs:Application',
    type: PropType.String,
    sortable: true,
  },
  {
    name: 'identity',
    displayName: 'AbpAccount::MySecurityLogs:Identity',
    type: PropType.String,
    sortable: true,
  },
  {
    name: 'clientId',
    displayName: 'AbpAccount::MySecurityLogs:Client',
    type: PropType.String,
    sortable: true,
  },
]);
export const DEFAULT_MY_SECURITY_LOGS_ENTITY_ACTIONS =
  EntityAction.createMany<IdentitySecurityLogDto>([]);
export const DEFAULT_MY_SECURITY_LOGS_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly IdentitySecurityLogDto[]
>([]);
