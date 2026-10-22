import { defineService, inject, TokenStorage, type ServiceOf } from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type { AuthTokens, TokenResponse } from '../models/oauth.js';

// The key names `angular-oauth2-oidc` uses, so a solution that switches UIs on the same
// origin keeps its session -- the same reason `SessionStateService` keeps `abpSession`.
const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';
const EXPIRES_AT = 'expires_at';
const TENANT_BINDING = 'abpOAuthTenantBinding';

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

  function readStored(): AuthTokens | null {
    const accessToken = storage.getItem(ACCESS_TOKEN);
    if (!accessToken) return null;
    const rawExpiry = storage.getItem(EXPIRES_AT);
    const expiresAt = rawExpiry === null ? Number.NaN : Number(rawExpiry);
    let tenantId: string | null | undefined;
    const rawTenant = storage.getItem(TENANT_BINDING);
    if (rawTenant !== null) {
      try {
        const parsed: unknown = JSON.parse(rawTenant);
        if (parsed === null || typeof parsed === 'string') tenantId = parsed;
      } catch {
        // Invalid legacy metadata cannot establish a tenant binding.
      }
    }
    return {
      accessToken,
      refreshToken: storage.getItem(REFRESH_TOKEN) ?? undefined,
      expiresAt: Number.isNaN(expiresAt) ? 0 : expiresAt,
      ...(tenantId === undefined ? {} : { tenantId }),
    };
  }

  function persist(next: AuthTokens | null): void {
    tokens.value = next;
    if (!next) {
      for (const key of [ACCESS_TOKEN, REFRESH_TOKEN, EXPIRES_AT, TENANT_BINDING])
        storage.removeItem(key);
      return;
    }
    storage.setItem(ACCESS_TOKEN, next.accessToken);
    storage.setItem(EXPIRES_AT, String(next.expiresAt));
    if (next.refreshToken) storage.setItem(REFRESH_TOKEN, next.refreshToken);
    else storage.removeItem(REFRESH_TOKEN);
    if (next.tenantId === undefined) storage.removeItem(TENANT_BINDING);
    else storage.setItem(TENANT_BINDING, JSON.stringify(next.tenantId));
  }

  return {
    isAuthenticated: computed(() => tokens.value !== null) as ComputedRef<boolean>,
    getAccessToken: (): string | null => tokens.value?.accessToken ?? null,
    getRefreshToken: (): string | null => tokens.value?.refreshToken ?? null,
    getExpiresAt: (): number | null => tokens.value?.expiresAt ?? null,
    getTenantId: (): string | null | undefined => tokens.value?.tenantId,
    readStored,
    bindTenant: (tenantId: string | null): void => {
      if (tokens.value) persist({ ...tokens.value, tenantId });
    },

    set: (next: AuthTokens | null): void => {
      tokens.value = next;
    },

    /** Writes the tokens where a reload will find them again. */
    persist,

    /** Reads back what a previous visit persisted, expired or not. */
    restore: (): AuthTokens | null => {
      const restored = readStored();
      tokens.value = restored;
      return restored;
    },
  };
});
export type AuthStateService = ServiceOf<typeof AuthStateService>;
