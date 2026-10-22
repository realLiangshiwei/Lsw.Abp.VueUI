import { defineToken } from '@lsw-abpvue/core';
import type { AccountProOptions } from '../models/options.js';
export const ACCOUNT_PRO_OPTIONS = defineToken<AccountProOptions>('ACCOUNT_PRO_OPTIONS', {
  factory: () => ({}),
});
