import {
  EntityAction,
  EntityProp,
  PropType,
  ToolbarAction,
  type EntityPropOptions,
} from '@lsw-abpvue/components';
import { ConfigStateService } from '@lsw-abpvue/core';
import type { IdentitySecurityLogDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  IDENTITY_PRO_SECURITY_LOGS_PAGE,
  type IdentitySecurityLogFilterField,
} from '../tokens/security-logs-page.token.js';
import { formatIdentityUserDetailsDate } from '../utils/user-details.js';
const linked = (
  name: IdentitySecurityLogFilterField,
  label: string,
  width: number,
): EntityPropOptions<IdentitySecurityLogDto> => ({
  name,
  displayName: label,
  type: PropType.String,
  sortable: true,
  columnWidth: width,
  action: data => data.getInjected(IDENTITY_PRO_SECURITY_LOGS_PAGE).filter(name, data.record[name]),
});
export const DEFAULT_SECURITY_LOGS_ENTITY_PROPS = EntityProp.createMany<IdentitySecurityLogDto>([
  {
    name: 'creationTime',
    displayName: 'AbpIdentity::Date',
    type: PropType.DateTime,
    sortable: true,
    columnWidth: 180,
    valueResolver: data =>
      formatIdentityUserDetailsDate(
        data.record.creationTime,
        data.getInjected(ConfigStateService).snapshot().localization.currentCulture,
      ) ?? '',
  },
  linked('action', 'AbpIdentity::SecurityLogs:Action', 180),
  {
    name: 'clientIpAddress',
    displayName: 'AbpIdentity::SecurityLogs:IpAddress',
    type: PropType.String,
    sortable: false,
    columnWidth: 200,
  },
  {
    name: 'browserInfo',
    displayName: 'AbpIdentity::SecurityLogs:Browser',
    type: PropType.String,
    sortable: false,
    columnWidth: 200,
  },
  linked('applicationName', 'AbpIdentity::SecurityLogs:Application', 150),
  linked('identity', 'AbpIdentity::SecurityLogs:Identity', 150),
  linked('userName', 'AbpIdentity::SecurityLogs:UserName', 150),
  linked('clientId', 'AbpIdentity::SecurityLogs:Client', 320),
  linked('correlationId', 'AbpIdentity::SecurityLogs:CorrelationId', 320),
]);
export const DEFAULT_SECURITY_LOGS_ENTITY_ACTIONS = EntityAction.createMany<IdentitySecurityLogDto>(
  [
    {
      text: 'AbpIdentity::Details',
      permission: 'AbpIdentity.SecurityLogs',
      action: data => data.getInjected(IDENTITY_PRO_SECURITY_LOGS_PAGE).viewDetails(data.record),
    },
  ],
);
export const DEFAULT_SECURITY_LOGS_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly IdentitySecurityLogDto[]
>([]);
