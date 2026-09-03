import {
  AbpHttpError,
  AuthErrorFilterService,
  ConfigStateService,
  defineService,
  EnvironmentService,
  inject,
  type AuthService,
  type LoginParams,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { AuthCodeFlowStrategy } from '../strategies/auth-code-flow.strategy.js';
import { PasswordFlowStrategy } from '../strategies/password-flow.strategy.js';
import type { AuthFlowStrategy } from '../strategies/strategy.js';
import { AuthStateService } from './auth-state.service.js';

/**
 * The `AuthService` `@lsw-abpvue/core` declares. Which flow answers is decided by the
 * identity server's configuration, the same way ABP's Angular UI decides it: a
 * `responseType` of `code` means the authorization code flow, anything else the password
 * flow.
 */
export const AbpOAuthService = defineService('AbpOAuthService', () => {
  const environment = inject(EnvironmentService);
  const state = inject(AuthStateService);
  const configState = inject(ConfigStateService);
  const filters = inject(AuthErrorFilterService);
  const code = inject(AuthCodeFlowStrategy);
  const password = inject(PasswordFlowStrategy);

  const strategy = (): AuthFlowStrategy =>
    environment.getEnvironment().oAuthConfig?.responseType === 'code' ? code : password;

  return {
    isAuthenticated: state.isAuthenticated,
    get isInternalAuth(): boolean {
      return strategy().isInternalAuth;
    },

    init: (): Promise<void> => strategy().init(),
    navigateToLogin: (returnUrl?: string): Promise<void> => strategy().navigateToLogin(returnUrl),
    login: (params: LoginParams): Promise<void> => strategy().login(params),
    logout: (queryParams?: Record<string, string>): Promise<void> => strategy().logout(queryParams),

    getAccessToken: (): string | null => state.getAccessToken(),
    getRefreshToken: (): string | null => state.getRefreshToken(),

    /**
     * A failed renewal is the session ending, unless a filter claims it. Ending it means
     * dropping the tokens, telling the backend to describe an anonymous visitor, and
     * sending the user where they can log in again.
     */
    refreshToken: async (): Promise<void> => {
      try {
        await strategy().refresh();
      } catch (error) {
        if (error instanceof AbpHttpError && filters.run(error)) throw error;

        await strategy().clear();
        await configState.refreshAppState();
        await strategy().navigateToLogin();
        throw error;
      }
    },
  } satisfies AuthService & { getRefreshToken(): string | null };
});
export type AbpOAuthService = ServiceOf<typeof AbpOAuthService>;
