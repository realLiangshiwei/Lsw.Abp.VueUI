import {
  ConfigStateService,
  defineService,
  defineToken,
  inject,
  onServiceDestroy,
  PIPE_TO_LOGIN_FN,
  type LoginParams,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { AuthNavigationService } from '../services/auth-navigation.service';
import { AuthStateService, toTokens } from '../services/auth-state.service';
import { RememberMeService } from '../services/remember-me.service';
import { TokenEndpointService } from '../services/token-endpoint.service';
import type { AuthFlowStrategy } from './strategy';

/** Where an anonymous visitor is sent. The account module owns this route. */
export const LOGIN_ROUTE = defineToken<string>('LOGIN_ROUTE', {
  factory: () => '/account/login',
});

/** Renew this long before the token lapses, so a request in flight is never cut off. */
const RENEW_MARGIN_MS = 60_000;
/** `setTimeout` truncates past this, which would fire the renewal immediately. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * ABP's password grant: the application collects the credentials itself and exchanges
 * them at the token endpoint.
 */
export const PasswordFlowStrategy = defineService('PasswordFlowStrategy', (): AuthFlowStrategy => {
  const tokenEndpoint = inject(TokenEndpointService);
  const state = inject(AuthStateService);
  const rememberMe = inject(RememberMeService);
  const navigation = inject(AuthNavigationService);
  const configState = inject(ConfigStateService);
  const pipeToLogin = inject(PIPE_TO_LOGIN_FN);
  const loginRoute = inject(LOGIN_ROUTE);
  let renewal: ReturnType<typeof setTimeout> | undefined;

  onServiceDestroy(() => clearTimeout(renewal));

  function forget(): void {
    clearTimeout(renewal);
    state.persist(null);
    rememberMe.remove();
  }

  /**
   * Angular renews on the library's `token_expires` event; without a library the timer
   * is ours. It is what makes `isAuthenticated` stop being true when the token lapses.
   */
  function scheduleRenewal(): void {
    clearTimeout(renewal);
    const expiresAt = state.getExpiresAt();
    if (expiresAt === null || !Number.isFinite(expiresAt)) return;

    const delay = Math.min(Math.max(expiresAt - Date.now() - RENEW_MARGIN_MS, 0), MAX_TIMEOUT_MS);
    renewal = setTimeout(() => {
      void renew();
    }, delay);
  }

  async function renew(): Promise<void> {
    const refreshToken = state.getRefreshToken();
    if (!refreshToken) {
      forget();
      await configState.refreshAppState();
      return;
    }

    state.persist(toTokens(await tokenEndpoint.refresh(refreshToken)));
    scheduleRenewal();
  }

  return {
    isInternalAuth: true,

    init: async (): Promise<void> => {
      const restored = state.restore();
      if (!restored) return;

      const expired = restored.expiresAt <= Date.now();
      // Someone who did not ask to be remembered gets one session, not a renewed one.
      if (expired && !rememberMe.get() && !rememberMe.fromToken(restored.accessToken)) {
        forget();
        return;
      }

      if (expired) await renew();
      else scheduleRenewal();
    },

    navigateToLogin: async (returnUrl?: string): Promise<void> => {
      const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
      await navigation.go(`${loginRoute}${query}`);
    },

    login: async (params: LoginParams): Promise<void> => {
      const response = await tokenEndpoint.password(params);

      state.persist(toTokens(response));
      rememberMe.set(params.rememberMe ?? rememberMe.fromToken(response.access_token));
      scheduleRenewal();

      await pipeToLogin(params);
    },

    logout: async (): Promise<void> => {
      const refreshToken = state.getRefreshToken();
      const accessToken = state.getAccessToken();

      // Revoked before the local copy goes, because revoking needs the token itself.
      if (refreshToken) await tokenEndpoint.revoke(refreshToken, 'refresh_token');
      if (accessToken) await tokenEndpoint.revoke(accessToken, 'access_token');

      forget();
      await configState.refreshAppState();
      await navigation.go('/');
    },

    refresh: renew,

    clear: (): Promise<void> => {
      forget();
      return Promise.resolve();
    },
  };
});
export type PasswordFlowStrategy = ServiceOf<typeof PasswordFlowStrategy>;
