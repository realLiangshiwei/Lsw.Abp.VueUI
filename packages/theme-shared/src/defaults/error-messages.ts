import type { LocalizationParam } from '@lsw-abpvue/core';

export interface ErrorMessage {
  title: LocalizationParam;
  details: LocalizationParam;
}

export const DEFAULT_ERROR_MESSAGES: Record<
  'default' | '401' | '403' | '404' | '500',
  ErrorMessage
> = {
  default: {
    title: 'AbpUi::DefaultErrorMessage',
    details: 'AbpUi::DefaultErrorMessageDetail',
  },
  401: {
    title: 'AbpUi::DefaultErrorMessage401',
    details: 'AbpUi::DefaultErrorMessage401Detail',
  },
  403: {
    title: 'AbpUi::DefaultErrorMessage403',
    details: 'AbpUi::DefaultErrorMessage403Detail',
  },
  404: {
    title: 'AbpUi::DefaultErrorMessage404',
    details: 'AbpUi::DefaultErrorMessage404Detail',
  },
  500: {
    title: 'AbpUi::InternalServerErrorMessage',
    details: 'AbpUi::DefaultErrorMessage',
  },
};

/** The message for a status, falling back to the one that fits anything. */
export function errorMessageFor(status: number): ErrorMessage {
  const key = String(status) as keyof typeof DEFAULT_ERROR_MESSAGES;
  return DEFAULT_ERROR_MESSAGES[key] ?? DEFAULT_ERROR_MESSAGES.default;
}
