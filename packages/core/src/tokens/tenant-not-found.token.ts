import { defineToken } from '../di/token.js';
import type { TenantNotFoundError } from '../models/tenant.js';

/**
 * Shows the visitor that the address named a tenant nobody has heard of. Nothing
 * provides it by default: a theme does, because saying so needs a dialog.
 */
export const TENANT_NOT_FOUND_BY_NAME = defineToken<(error: TenantNotFoundError) => void>(
  'TENANT_NOT_FOUND_BY_NAME',
);
