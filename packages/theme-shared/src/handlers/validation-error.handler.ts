import { defineService, inject, type AbpHttpError } from '@lsw-abpvue/core';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ValidationErrorService } from '../services/validation-error.service.js';

/**
 * A rejected save belongs next to the fields that were rejected. Only claims the error
 * when a form is actually listening, so a 400 raised by something with no form on screen
 * still reaches the handler that can say something about it.
 */
export const ValidationErrorHandler = defineService<AbpErrorHandler>(
  'ValidationErrorHandler',
  () => {
    const validation = inject(ValidationErrorService);

    return {
      priority: 30,

      canHandle: (error: AbpHttpError): boolean =>
        error.status === 400 &&
        (error.error?.validationErrors?.length ?? 0) > 0 &&
        validation.hasTarget,

      handle: (error: AbpHttpError): void => {
        validation.dispatch(error.error?.validationErrors);
      },
    };
  },
);
