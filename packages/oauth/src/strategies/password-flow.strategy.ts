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

/** The stored session cannot be renewed, so there is nothing to renew it with. */
class NoRefreshTokenError extends Error {
  constructor() {
    super('The session has expired and there is no refresh token to renew it with.');
    this.name = 'NoRefreshTokenError';
  }
}

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
    // A timer has no caller to hand a failure to, and a renewal that cannot happen is
    // the session ending -- which is something to do, not something to report.
    renewal = setTimeout(() => void renew().catch(endSession), delay);
  }

  async function renew(): Promise<void> {
    const refreshToken = state.getRefreshToken();
    if (!refreshToken) throw new NoRefreshTokenError();

    state.persist(toTokens(await tokenEndpoint.refresh(refreshToken)));
    scheduleRenewal();
  }

  async function navigateToLogin(returnUrl?: string): Promise<void> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    await navigation.go(`${loginRoute}${query}`);
  }

  /**
   * Nothing is left of the session: drop the tokens, let the backend describe an
   * anonymous visitor, and go where a new session can be started. Whatever fails in here
   * has no caller left to reach and was already reported by `RestService`; the one thing
   * that matters -- the tokens going -- has happened by then.
   */
  async function endSession(): Promise<void> {
    forget();

    try {
      await configState.refreshAppState();
      await navigateToLogin();
    } catch {
      // Nothing further to try.
    }
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

      // A stored session that cannot be renewed leaves an anonymous visitor, not a
      // failed startup -- the configuration request right after this one settles it.
      if (expired) await renew().catch(() => forget());
      else scheduleRenewal();
    },

    navigateToLogin,

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

      // Revoked before the local copy goes, because revoking needs the token itself --
      // but a server that will not take it back is no reason to keep the user signed in.
      // The tokens go regardless; the next request would be refused anyway.
      try {
        if (refreshToken) await tokenEndpoint.revoke(refreshToken, 'refresh_token');
        if (accessToken) await tokenEndpoint.revoke(accessToken, 'access_token');
      } catch {
        // Reported by `RestService`; logging out locally is what the user asked for.
      }

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
