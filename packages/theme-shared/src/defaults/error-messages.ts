import type { LocalizationWithDefault } from '@lsw-abpvue/core';

export interface ErrorMessage {
  title: LocalizationWithDefault;
  details: LocalizationWithDefault;
}

/**
 * ABP's own texts for the statuses it has words for. Key and fallback together, because
 * a 500 while the application configuration is still loading has no localization to read
 * from and a blank page is the one thing worse than an English one.
 */
export const DEFAULT_ERROR_MESSAGES: Record<
  'default' | '401' | '403' | '404' | '500',
  ErrorMessage
> = {
  default: {
    title: { key: 'AbpUi::DefaultErrorMessage', defaultValue: 'An error has occurred!' },
    details: {
      key: 'AbpUi::DefaultErrorMessageDetail',
      defaultValue: 'Error detail not sent by server.',
    },
  },
  401: {
    title: { key: 'AbpUi::DefaultErrorMessage401', defaultValue: 'You are not authenticated!' },
    details: {
      key: 'AbpUi::DefaultErrorMessage401Detail',
      defaultValue: 'You should be authenticated (sign in) in order to perform this operation.',
    },
  },
  403: {
    title: { key: 'AbpUi::DefaultErrorMessage403', defaultValue: 'You are not authorized!' },
    details: {
      key: 'AbpUi::DefaultErrorMessage403Detail',
      defaultValue: 'You are not allowed to perform this operation.',
    },
  },
  404: {
    title: { key: 'AbpUi::DefaultErrorMessage404', defaultValue: 'Resource not found!' },
    details: {
      key: 'AbpUi::DefaultErrorMessage404Detail',
      defaultValue: 'The resource requested could not found on the server.',
    },
  },
  500: {
    title: { key: 'AbpUi::500Message', defaultValue: 'Internal server error' },
    details: {
      key: 'AbpUi::DefaultErrorMessage',
      defaultValue: 'Error detail not sent by server.',
    },
  },
};

/** The message for a status, falling back to the one that fits anything. */
export function errorMessageFor(status: number): ErrorMessage {
  const key = String(status) as keyof typeof DEFAULT_ERROR_MESSAGES;
  return DEFAULT_ERROR_MESSAGES[key] ?? DEFAULT_ERROR_MESSAGES.default;
}
