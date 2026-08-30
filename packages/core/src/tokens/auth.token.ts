import type { ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineToken } from '../di/token';
import type { CheckAuthenticationStateFn, LoginParams, PipeToLoginFn } from '../models/auth';
import { BrowserTokenStorage } from '../services/token-storage.service';

/**
 * What the rest of the framework needs from authentication. `core` never implements it:
 * `@lsw-abpvue/oauth` provides the OIDC one, and a host with its own scheme provides
 * another.
 */
export interface AuthService {
  /** Restores a stored session and takes over an authorization callback, if any. */
  init(): Promise<void>;
  readonly isAuthenticated: ComputedRef<boolean>;
  /**
   * True when the application logs in with its own form, false when it hands over to
   * the identity server. A login page shows or skips its form on this.
   */
  readonly isInternalAuth: boolean;
  navigateToLogin(returnUrl?: string): Promise<void>;
  logout(queryParams?: Record<string, string>): Promise<void>;
  /** The password flow. Throws `AuthError` when the token endpoint refuses. */
  login(params: LoginParams): Promise<void>;
  getAccessToken(): string | null;
  refreshToken(): Promise<void>;
}

export const AuthService = defineToken<AuthService>('AuthService', {
  hint:
    'AuthService is an abstract token — it must be provided by an authentication package.\n' +
    '  Did you forget to add provideAbpOAuth() to createAbpApp({ providers: [...] })?',
});

/**
 * Where tokens are kept. Separate from `StorageService` because it is the one thing a
 * host is likely to want somewhere else -- in memory, in a cookie, in a worker.
 */
export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** The keys currently held, so a consumer can find and clear the ones it wrote. */
  keys(): string[];
}

export const TokenStorage = defineToken<TokenStorage>('TokenStorage', {
  factory: () => inject(BrowserTokenStorage),
});

export const PIPE_TO_LOGIN_FN = defineToken<PipeToLoginFn>('PIPE_TO_LOGIN_FN');

export const CHECK_AUTHENTICATION_STATE_FN = defineToken<CheckAuthenticationStateFn>(
  'CHECK_AUTHENTICATION_STATE_FN',
  { factory: () => () => {} },
);

/**
 * Opens the backend's own profile page. ABP has no API for changing a password or
 * managing two-factor, so this leaves the application.
 */
export const NAVIGATE_TO_MANAGE_PROFILE = defineToken<() => void>('NAVIGATE_TO_MANAGE_PROFILE');
