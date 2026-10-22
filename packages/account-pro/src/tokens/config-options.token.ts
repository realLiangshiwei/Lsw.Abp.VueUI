import { defineToken } from '@lsw-abpvue/core';
import type { AccountProConfigOptions } from '../models/config-options.js';

export const ACCOUNT_PRO_CONFIG_OPTIONS = defineToken<AccountProConfigOptions>(
  'ACCOUNT_PRO_CONFIG_OPTIONS',
  { factory: () => ({}) },
);
/** Context available to security-log column and action contributors. */
export interface AccountProSecurityLogsPageContext {
  filterAction(value: string | undefined): void;
}
export const ACCOUNT_PRO_SECURITY_LOGS_PAGE = defineToken<AccountProSecurityLogsPageContext>(
  'ACCOUNT_PRO_SECURITY_LOGS_PAGE',
);
