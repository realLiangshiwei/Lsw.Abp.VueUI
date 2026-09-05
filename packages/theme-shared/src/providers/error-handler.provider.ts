import type { InjectionToken, Provider } from '@lsw-abpvue/core';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ABP_ERROR_HANDLERS } from '../tokens/error-handlers.token.js';

/**
 * Adds a handler to the chain.
 * @param handler Token of the handler service, so replacing that token replaces what
 * runs without touching the chain
 */
export function provideErrorHandler(
  handler: InjectionToken<AbpErrorHandler>,
): Provider<AbpErrorHandler[]> {
  return { provide: ABP_ERROR_HANDLERS, multi: true, useExisting: handler };
}
