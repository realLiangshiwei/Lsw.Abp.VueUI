import { AuthService, defineService, inject, type AbpHttpError } from '@lsw-abpvue/core';
import type { AbpErrorHandler } from '../models/error-handler.js';

/**
 * A 401 that got this far means the session is over: the authentication package retries
 * a request once with a refreshed token before reporting anything. With no
 * authentication package there is nowhere to send the user, so the error falls through
 * to the handler that shows the 401 page.
 */
export const AuthenticationErrorHandler = defineService<AbpErrorHandler>(
  'AuthenticationErrorHandler',
  () => {
    const auth = inject(AuthService, { optional: true });

    return {
      priority: 10,

      canHandle: (error: AbpHttpError): boolean => error.status === 401 && auth !== null,

      handle: async (): Promise<void> => {
        await auth?.navigateToLogin();
      },
    };
  },
);
