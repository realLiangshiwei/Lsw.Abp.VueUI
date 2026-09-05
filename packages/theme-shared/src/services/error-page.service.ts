import { defineService, inject, type ServiceOf } from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type { AbpErrorPage } from '../models/error-handler.js';

/**
 * The error that has taken over the page, if any. The theme renders it; nothing here
 * knows what it looks like.
 */
export const ErrorPageService = defineService('ErrorPageService', () => {
  const current = shallowRef<AbpErrorPage | null>(null);

  return {
    /** @param page What went wrong, in the words the user gets to read */
    show: (page: AbpErrorPage): void => {
      current.value = { showHome: true, ...page };
    },

    clear: (): void => {
      current.value = null;
    },

    current: computed(() => current.value) as ComputedRef<AbpErrorPage | null>,
  };
});
export type ErrorPageService = ServiceOf<typeof ErrorPageService>;

export const useErrorPage = (): ErrorPageService => inject(ErrorPageService);
