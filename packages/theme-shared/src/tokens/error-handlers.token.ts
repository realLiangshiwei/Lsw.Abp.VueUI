import { defineToken } from '@lsw-abpvue/core';
import type { AbpErrorHandler } from '../models/error-handler.js';

/**
 * The handler chain. An application adds its own with `provideErrorHandler()` and
 * replaces one of ours by providing a different implementation for the same token, so
 * neither needs the chain itself to be rebuilt.
 */
export const ABP_ERROR_HANDLERS = defineToken<AbpErrorHandler[]>('ABP_ERROR_HANDLERS', {
  multi: true,
});
