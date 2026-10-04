import { defineService, inject } from '@lsw-abpvue/core';
import {
  provideErrorHandler,
  ToasterService,
  type AbpErrorHandler,
} from '@lsw-abpvue/theme-shared';

export const RateLimitHandler = defineService<AbpErrorHandler>('RateLimitHandler', () => {
  const toaster = inject(ToasterService);
  return {
    priority: 35,
    canHandle: error => error.status === 429,
    handle: error => {
      toaster.warn({
        key: 'BookStore::RateLimited',
        defaultValue: error.error?.message ?? 'Too many requests. Try again later.',
      });
    },
  };
});

export const rateLimitProvider = provideErrorHandler(RateLimitHandler);
