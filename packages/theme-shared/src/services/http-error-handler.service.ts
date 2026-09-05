import {
  defineService,
  HttpErrorReporterService,
  inject,
  onServiceDestroy,
  type AbpHttpError,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { AbpErrorHandler } from '../models/error-handler.js';
import { ABP_ERROR_HANDLERS } from '../tokens/error-handlers.token.js';

/**
 * Runs the handler chain. `core` reports every failed request it was asked to report;
 * this decides what the user sees, which is why it lives with the theme rather than with
 * the transport.
 */
export const HttpErrorHandlerService = defineService('HttpErrorHandlerService', () => {
  const reporter = inject(HttpErrorReporterService);
  const ordered = [...(inject(ABP_ERROR_HANDLERS, { optional: true }) ?? [])].sort(
    (first, second) => first.priority - second.priority,
  );

  let stop: (() => void) | null = null;
  onServiceDestroy(() => {
    stop?.();
    stop = null;
  });

  async function handle(error: AbpHttpError): Promise<AbpErrorHandler | null> {
    for (const handler of ordered) {
      if (!handler.canHandle(error)) continue;

      await handler.handle(error);
      return handler;
    }

    return null;
  }

  return {
    /** Subscribes to the reporter. Idempotent; the app initializer calls it. */
    init: (): void => {
      stop ??= reporter.onError(error => {
        // A handler that throws is a bug in the handler, and swallowing it here would
        // leave the user with a failed request and no sign of either problem.
        void handle(error).catch((cause: unknown) => {
          console.error('[abp] an error handler threw while handling', error, cause);
        });
      });
    },

    /**
     * Gives one error to the chain.
     * @param error The failed request
     * @returns The handler that took it, or `null` when none would
     */
    handle,

    /** The chain in the order it runs, for a host checking what it ended up with. */
    handlers: ordered as readonly AbpErrorHandler[],
  };
});
export type HttpErrorHandlerService = ServiceOf<typeof HttpErrorHandlerService>;
