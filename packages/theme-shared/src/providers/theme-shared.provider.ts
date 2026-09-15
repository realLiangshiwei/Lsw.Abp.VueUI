import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ThemeSharedRouteNames } from '../defaults/route-names.js';
import { AbpFormatErrorHandler } from '../handlers/abp-format-error.handler.js';
import { AuthenticationErrorHandler } from '../handlers/authentication-error.handler.js';
import { StatusCodeErrorHandler } from '../handlers/status-code-error.handler.js';
import { TenantResolveErrorHandler } from '../handlers/tenant-resolve-error.handler.js';
import { UnknownStatusCodeErrorHandler } from '../handlers/unknown-status-code-error.handler.js';
import { ValidationErrorHandler } from '../handlers/validation-error.handler.js';
import { HttpErrorHandlerService } from '../services/http-error-handler.service.js';
import { provideErrorHandler } from './error-handler.provider.js';
import { provideUserMenuItems } from './user-menu.provider.js';

/**
 * What the contract layer needs at application scope: the default error handlers, and
 * the subscription that lets them see a failed request. A theme package includes it, so
 * an application usually provides the theme rather than this.
 */
export function provideAbpThemeShared(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideErrorHandler(AuthenticationErrorHandler),
    provideErrorHandler(TenantResolveErrorHandler),
    provideErrorHandler(ValidationErrorHandler),
    provideErrorHandler(AbpFormatErrorHandler),
    provideErrorHandler(StatusCodeErrorHandler),
    provideErrorHandler(UnknownStatusCodeErrorHandler),

    provideUserMenuItems(),

    provideAppInitializer(() => {
      inject(HttpErrorHandlerService).init();

      // The branch every administration module hangs its pages under. It is here rather
      // than in a theme because the modules name it, and they must not name a theme.
      inject(RoutesService).add([
        { name: ThemeSharedRouteNames.Administration, iconClass: 'bi bi-wrench', order: 100 },
      ]);
    }),
  ]);
}
