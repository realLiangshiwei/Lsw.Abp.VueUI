import type { ComputedRef } from 'vue';
import { defineToken } from '../di/token';

/**
 * What the rest of the framework needs from authentication. `core` never implements it:
 * `@lsw-abpvue/oauth` provides the OIDC one, and a host with its own scheme provides
 * another.
 */
export interface AuthService {
  init(): Promise<void>;
  readonly isAuthenticated: ComputedRef<boolean>;
  navigateToLogin(returnUrl?: string): Promise<void>;
  logout(queryParams?: Record<string, string>): Promise<void>;
  getAccessToken(): string | null;
  refreshToken(): Promise<void>;
}

export const AuthService = defineToken<AuthService>('AuthService', {
  hint:
    'AuthService is an abstract token — it must be provided by an authentication package.\n' +
    '  Did you forget to add provideAbpOAuth() to createAbpApp({ providers: [...] })?',
});
