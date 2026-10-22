import { defineToken } from '@lsw-abpvue/core';
import type { IdentitySecurityLogDto } from '@lsw-abpvue/identity-pro/proxy';
export type IdentitySecurityLogFilterField =
  'action' | 'applicationName' | 'identity' | 'userName' | 'clientId' | 'correlationId';
/** The operations exposed to security log extension contributors. */
export interface IdentityProSecurityLogsPageCommands {
  filter(name: IdentitySecurityLogFilterField, value: string | undefined): void;
  viewDetails(record: IdentitySecurityLogDto): void;
}
export const IDENTITY_PRO_SECURITY_LOGS_PAGE = defineToken<IdentityProSecurityLogsPageCommands>(
  'IDENTITY_PRO_SECURITY_LOGS_PAGE',
);
