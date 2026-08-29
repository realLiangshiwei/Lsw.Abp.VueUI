import { inject } from '../di/inject';
import { defineToken } from '../di/token';
import { ABP_ROOT_OPTIONS } from './root-options.token';

/** Name of the tenant header and query parameter; `__tenant` unless the host changed it. */
export const TENANT_KEY = defineToken<string>('TENANT_KEY', {
  factory: () => inject(ABP_ROOT_OPTIONS).tenantKey,
});
