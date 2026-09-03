import { defineService, inject, TokenStorage, type ServiceOf } from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type { AuthTokens, TokenResponse } from '../models/oauth.js';

// The key names `angular-oauth2-oidc` uses, so a solution that switches UIs on the same
// origin keeps its session -- the same reason `SessionStateService` keeps `abpSession`.
const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';
const EXPIRES_AT = 'expires_at';

/** Turns a token response into what is kept, resolving `expires_in` against now. */
export function toTokens(response: TokenResponse): AuthTokens {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt:
      response.expires_in === undefined ? Infinity : Date.now() + response.expires_in * 1000,
  };
}

/**
 * The one place that answers "are we logged in, and with what". Both flows write here:
 * the password flow after a token response, the authorization code flow whenever
 * `oidc-client-ts` loads or drops its user.
 */
export const AuthStateService = defineService('AuthStateService', () => {
  const storage = inject(TokenStorage);
  const tokens = shallowRef<AuthTokens | null>(null);

  return {
    isAuthenticated: computed(() => tokens.value !== null) as ComputedRef<boolean>,
    getAccessToken: (): string | null => tokens.value?.accessToken ?? null,
    getRefreshToken: (): string | null => tokens.value?.refreshToken ?? null,
    getExpiresAt: (): number | null => tokens.value?.expiresAt ?? null,

    set: (next: AuthTokens | null): void => {
      tokens.value = next;
    },

    /** Writes the tokens where a reload will find them again. */
    persist: (next: AuthTokens | null): void => {
      tokens.value = next;

      if (!next) {
        for (const key of [ACCESS_TOKEN, REFRESH_TOKEN, EXPIRES_AT]) storage.removeItem(key);
        return;
      }

      storage.setItem(ACCESS_TOKEN, next.accessToken);
      storage.setItem(EXPIRES_AT, String(next.expiresAt));
      if (next.refreshToken) storage.setItem(REFRESH_TOKEN, next.refreshToken);
      else storage.removeItem(REFRESH_TOKEN);
    },

    /** Reads back what a previous visit persisted, expired or not. */
    restore: (): AuthTokens | null => {
      const accessToken = storage.getItem(ACCESS_TOKEN);
      if (!accessToken) return null;

      // `Number('Infinity')` is `Infinity`, which is how a token the endpoint gave no
      // lifetime for comes back. Anything unreadable counts as expired: not knowing when
      // a token lapses is a reason to renew it, not to trust it forever.
      const stored = storage.getItem(EXPIRES_AT);
      const expiresAt = stored === null ? Number.NaN : Number(stored);
      const restored: AuthTokens = {
        accessToken,
        refreshToken: storage.getItem(REFRESH_TOKEN) ?? undefined,
        expiresAt: Number.isNaN(expiresAt) ? 0 : expiresAt,
      };

      tokens.value = restored;
      return restored;
    },
  };
});
export type AuthStateService = ServiceOf<typeof AuthStateService>;
