import type { LocalizationWithDefault } from '@lsw-abpvue/core';

/**
 * Texts ABP's own resources have no key for. Written as keys with the English as the
 * fallback: nothing breaks on a backend that has never heard of them, and the day one
 * does they are translated for free.
 */
export const AUTHENTICATOR_CODE: LocalizationWithDefault = {
  key: 'AbpAccount::AuthenticatorCode',
  defaultValue: 'Authenticator code',
};
