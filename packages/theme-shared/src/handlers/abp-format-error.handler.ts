import { defineService, inject, type AbpHttpError, type LocalizationParam } from '@lsw-abpvue/core';
import { DEFAULT_ERROR_MESSAGES } from '../defaults/error-messages.js';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ConfirmationService } from '../services/confirmation.service.js';
import { ToasterService } from '../services/toaster.service.js';

const HEADER = '_AbpErrorFormat';

/**
 * ABP's own error envelope: a message the backend already localized, sometimes with
 * details underneath. Details go in a dialog, because they are the kind of thing a user
 * needs time to read; a message on its own is a toast.
 */
export const AbpFormatErrorHandler = defineService<AbpErrorHandler>('AbpFormatErrorHandler', () => {
  const confirmation = inject(ConfirmationService);
  const toaster = inject(ToasterService);

  return {
    priority: 40,

    canHandle: (error: AbpHttpError): boolean =>
      error.headers?.has(HEADER) === true ||
      Boolean(error.error?.message) ||
      Boolean(error.error?.code),

    handle: async (error: AbpHttpError): Promise<void> => {
      const envelope = error.error ?? {};
      const fallback: LocalizationParam = DEFAULT_ERROR_MESSAGES.default.title;

      if (envelope.details) {
        await confirmation.error(envelope.details, envelope.message ?? fallback, {
          hideCancelBtn: true,
          yesText: { key: 'AbpUi::Close', defaultValue: 'Close' },
        });
        return;
      }

      toaster.error(envelope.message ?? fallback);
    },
  };
});
