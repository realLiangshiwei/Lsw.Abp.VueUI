import { defineService, inject, type AbpHttpError } from '@lsw-abpvue/core';
import { errorMessageFor } from '../defaults/error-messages.js';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ErrorPageService } from '../services/error-page.service.js';

const HANDLED = [401, 403, 404, 500];

/**
 * The four statuses ABP has words for. They end the page rather than the request: none
 * of them is something the current screen can carry on from.
 */
export const StatusCodeErrorHandler = defineService<AbpErrorHandler>(
  'StatusCodeErrorHandler',
  () => {
    const errorPage = inject(ErrorPageService);

    return {
      priority: 50,

      canHandle: (error: AbpHttpError): boolean => HANDLED.includes(error.status),

      handle: (error: AbpHttpError): void => {
        const message = errorMessageFor(error.status);
        errorPage.show({
          status: error.status,
          title: message.title,
          details: message.details,
        });
      },
    };
  },
);
