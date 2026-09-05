import { defineService, inject, type AbpHttpError } from '@lsw-abpvue/core';
import { DEFAULT_ERROR_MESSAGES } from '../defaults/error-messages.js';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ErrorPageService } from '../services/error-page.service.js';

/**
 * The end of the chain. It takes everything, so no failed request ever goes by without
 * the user being told something -- including the one that never reached the server,
 * where there is no status to go on at all.
 */
export const UnknownStatusCodeErrorHandler = defineService<AbpErrorHandler>(
  'UnknownStatusCodeErrorHandler',
  () => {
    const errorPage = inject(ErrorPageService);

    return {
      priority: 99,

      canHandle: (): boolean => true,

      handle: (error: AbpHttpError): void => {
        errorPage.show({
          status: error.status,
          title: DEFAULT_ERROR_MESSAGES.default.title,
          // A request that never landed has nothing from the server to quote, so the
          // transport's own message is the only thing that says what went wrong.
          details: error.isTransportFailure
            ? error.message
            : DEFAULT_ERROR_MESSAGES.default.details,
          showHome: !error.isTransportFailure,
        });
      },
    };
  },
);
