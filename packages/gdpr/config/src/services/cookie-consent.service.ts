import { defineService, inject, type ServiceOf } from '@lsw-abpvue/core';
import { computed, shallowRef } from 'vue';
import type { AbpCookieConsentOptions } from '../models/options.js';

export const CookieConsentService = defineService('CookieConsentService', () => {
  const options = shallowRef<AbpCookieConsentOptions>({});
  return {
    cookieConsentOptions: computed(() => options.value),
    setOptions: (value: AbpCookieConsentOptions): void => {
      options.value = { ...value };
    },
  };
});
export type CookieConsentService = ServiceOf<typeof CookieConsentService>;
export const useCookieConsent = (): CookieConsentService => inject(CookieConsentService);
