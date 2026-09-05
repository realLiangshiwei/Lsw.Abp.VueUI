import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { StatusCodeErrorHandler } from '../handlers/status-code-error.handler.js';
import { UnknownStatusCodeErrorHandler } from '../handlers/unknown-status-code-error.handler.js';
import { HttpErrorHandlerService } from '../services/http-error-handler.service.js';
import { provideErrorHandler } from './error-handler.provider.js';

/**
 * What the contract layer needs at application scope: the default error handlers, and
 * the subscription that lets them see a failed request. A theme package includes it, so
 * an application usually provides the theme rather than this.
 */
export function provideAbpThemeShared(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideErrorHandler(StatusCodeErrorHandler),
    provideErrorHandler(UnknownStatusCodeErrorHandler),

    provideAppInitializer(() => {
      inject(HttpErrorHandlerService).init();
    }),
  ]);
}
