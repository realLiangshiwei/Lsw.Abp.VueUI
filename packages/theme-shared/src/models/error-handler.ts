import type { AbpHttpError, LocalizationParam } from '@lsw-abpvue/core';

/**
 * One rule about what a failed request means for the user. The first handler that says
 * it can take an error takes it, so a handler that answers `true` to everything ends the
 * chain -- which is what the fallback is for.
 */
export interface AbpErrorHandler {
  /** Lower runs first. The built-in ones are 10 to 99, leaving room on either side. */
  readonly priority: number;
  canHandle(error: AbpHttpError): boolean;
  handle(error: AbpHttpError): void | Promise<void>;
}

/** What the theme renders in place of the page when a request ends the page. */
export interface AbpErrorPage {
  status: number;
  title: LocalizationParam;
  details?: LocalizationParam | undefined;
  /** Offers a way back into the application. */
  showHome?: boolean | undefined;
}
