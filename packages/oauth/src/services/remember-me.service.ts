import { defineService, inject, StorageService, type ServiceOf } from '@lsw-abpvue/core';
import { decodeJwt } from '../utils/jwt.js';

const REMEMBER_ME = 'remember_me';

/**
 * Whether the user asked to stay logged in. Without it an expired token ends the
 * session; with it the flow tries to renew instead.
 */
export const RememberMeService = defineService('RememberMeService', () => {
  const storage = inject(StorageService);

  return {
    get: (): boolean => storage.getItem(REMEMBER_ME) === 'true',
    set: (remember: boolean): void => storage.setItem(REMEMBER_ME, String(remember)),
    remove: (): void => storage.removeItem(REMEMBER_ME),

    /** ABP puts a `remember_me` claim in the token when the login form asked for it. */
    fromToken: (accessToken: string | null): boolean =>
      Boolean(accessToken && decodeJwt(accessToken)?.[REMEMBER_ME]),
  };
});
export type RememberMeService = ServiceOf<typeof RememberMeService>;
