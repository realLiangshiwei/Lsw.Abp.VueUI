import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import type { AbpHttpError } from '../models/http.js';

/**
 * Where failed requests are announced, so the theme can show a modal, a toast or a
 * redirect to login without every caller having to think about it.
 */
export const HttpErrorReporterService = defineService('HttpErrorReporterService', () => {
  const listeners = new Set<(error: AbpHttpError) => void>();

  return {
    reportError: (error: AbpHttpError): void => {
      for (const listener of [...listeners]) listener(error);
    },

    /**
     * @param callback Receives every reported error
     * @returns Stops listening
     */
    onError: (callback: (error: AbpHttpError) => void): (() => void) => {
      listeners.add(callback);
      return () => void listeners.delete(callback);
    },
  };
});
export type HttpErrorReporterService = ServiceOf<typeof HttpErrorReporterService>;

export const useHttpErrorReporter = (): HttpErrorReporterService =>
  inject(HttpErrorReporterService);
