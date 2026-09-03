import { inject } from '../di/inject.js';
import { defineToken } from '../di/token.js';
import { ABP_ROOT_OPTIONS } from './root-options.token.js';

/** Name of the tenant header and query parameter; `__tenant` unless the host changed it. */
export const TENANT_KEY = defineToken<string>('TENANT_KEY', {
  factory: () => inject(ABP_ROOT_OPTIONS).tenantKey,
});
