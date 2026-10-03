import {
  ConfigStateService,
  defineService,
  defineToken,
  EnvironmentService,
  inject,
  SessionStateService,
  TENANT_KEY,
  TokenStorage,
  type OAuthConfig,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { UserManager, type User, type UserManagerSettings } from 'oidc-client-ts';
import { AuthNavigationService } from '../services/auth-navigation.service.js';
import { AuthStateService } from '../services/auth-state.service.js';
import { RememberMeService } from '../services/remember-me.service.js';
import { TokenStateStore } from '../services/token-state-store.js';
import {
  cultureFromCallback,
  cultureParams,
  isAuthorizationCallback,
  withoutCallbackParams,
} from '../utils/callback-url.js';
import type { AuthFlowStrategy } from './strategy.js';

/**
 * Where the library itself is built. A token for the same reason `HTTP_FETCH` is one:
 * it is the single place a third party takes over, so a test can watch what it is asked
 * to do without a network.
 */
export const USER_MANAGER_FACTORY = defineToken<(settings: UserManagerSettings) => UserManager>(
  'USER_MANAGER_FACTORY',
  { factory: () => settings => new UserManager(settings) },
);

/**
 * Turns ABP's `oAuthConfig` into what `oidc-client-ts` expects.
 * @param config The host's `environment.oAuthConfig`
 * @param storage Where the library may keep its state
 * @param tenant The tenant header to send with the token request, if any
 */
export function buildSettings(
  config: OAuthConfig,
  storage: TokenStorage,
  tenant?: { key: string; id: string } | undefined,
): UserManagerSettings {
  return {
    authority: config.issuer ?? '',
    client_id: config.clientId ?? '',
    redirect_uri: config.redirectUri ?? '',
    response_type: 'code',
    automaticSilentRenew: true,
    revokeTokensOnSignout: true,
    // The library sends the token request itself, so the tenant has to travel on the
    // settings rather than through our interceptors.
    extraHeaders: tenant ? { [tenant.key]: tenant.id } : {},
    stateStore: new TokenStateStore(storage, 'oidc.'),
    userStore: new TokenStateStore(storage, 'oidc.user.'),
    ...(config.metadataUrl ? { metadataUrl: config.metadataUrl } : {}),
    ...(config.metadataSeed
      ? {
          metadataSeed: Object.fromEntries(
            Object.entries(config.metadataSeed).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string',
            ),
          ),
        }
      : {}),
    ...(config.scope ? { scope: config.scope } : {}),
    ...(config.postLogoutRedirectUri
      ? { post_logout_redirect_uri: config.postLogoutRedirectUri }
      : {}),
    // Without one the library renews in an iframe pointed at `redirect_uri`, which boots
    // the whole application to answer one token request. The template ships a page that
    // does nothing else, and this is what points at it.
    ...(config.silentRefreshRedirectUri
      ? { silent_redirect_uri: config.silentRefreshRedirectUri }
      : {}),
    ...(config.dummyClientSecret ? { client_secret: config.dummyClientSecret } : {}),
  };
}

/**
 * The authorization code flow with PKCE, which is what an ABP solution uses by default.
 * `oidc-client-ts` owns the protocol; this owns where its state is kept, which tenant it
 * asks about, and what the rest of the application sees when it succeeds.
 */
export const AuthCodeFlowStrategy = defineService('AuthCodeFlowStrategy', (): AuthFlowStrategy => {
  const environment = inject(EnvironmentService);
  const session = inject(SessionStateService);
  const configState = inject(ConfigStateService);
  const state = inject(AuthStateService);
  const storage = inject(TokenStorage);
  const rememberMe = inject(RememberMeService);
  const navigation = inject(AuthNavigationService);
  const tenantKey = inject(TENANT_KEY);
  const create = inject(USER_MANAGER_FACTORY);
  let manager: UserManager | undefined;

  function userManager(): UserManager {
    if (manager) return manager;

    const tenantId = session.getTenant()?.id;
    manager = create(
      buildSettings(
        environment.getEnvironment().oAuthConfig ?? {},
        storage,
        tenantId ? { key: tenantKey, id: tenantId } : undefined,
      ),
    );

    manager.events.addUserLoaded(user => adopt(user));
    manager.events.addUserUnloaded(() => state.set(null));

    return manager;
  }

  function adopt(user: User): void {
    state.set({
      accessToken: user.access_token,
      refreshToken: user.refresh_token,
      expiresAt: user.expires_at === undefined ? Infinity : user.expires_at * 1000,
    });
  }

  async function handleCallback(url: URL): Promise<void> {
    // A code that has already been redeemed -- someone reloaded the callback page -- is
    // an anonymous visitor, not a blank screen. The address bar is cleaned either way,
    // so the reload after this one is an ordinary one.
    const user = await userManager()
      .signinCallback(url.href)
      .catch(() => undefined);

    const culture = cultureFromCallback(url);
    if (culture) session.setLanguage(culture);
    if (!user) {
      navigation.replaceUrl(withoutCallbackParams(url));
      return;
    }

    adopt(user);
    rememberMe.set(rememberMe.fromToken(user.access_token));

    // The address bar is corrected rather than navigated: the router is installed after
    // the initializers run, so its first navigation reads whatever is left here.
    const returnUrl = typeof user.state === 'string' && user.state ? user.state : undefined;
    navigation.replaceUrl(returnUrl ?? withoutCallbackParams(url));
  }

  return {
    isInternalAuth: false,

    init: async (): Promise<void> => {
      const href = navigation.currentUrl();
      if (!href) return;

      const url = new URL(href);
      if (isAuthorizationCallback(url)) {
        await handleCallback(url);
        return;
      }

      const user = await userManager().getUser();
      if (!user) return;

      if (!user.expired) {
        adopt(user);
        return;
      }

      // Someone who did not ask to be remembered gets one session, not a renewed one.
      if (!rememberMe.get() && !rememberMe.fromToken(user.access_token)) {
        await userManager().removeUser();
        return;
      }

      // A renewal that cannot happen leaves an anonymous visitor, not a failed startup.
      await userManager()
        .signinSilent()
        .catch(() => userManager().removeUser());
    },

    navigateToLogin: async (returnUrl?: string): Promise<void> => {
      await userManager().signinRedirect({
        ...(returnUrl ? { state: returnUrl } : {}),
        extraQueryParams: cultureParams(session.getLanguage()),
      });
    },

    /** There is no form to submit: asking to log in is the whole of it. */
    login: (): Promise<void> =>
      userManager().signinRedirect({ extraQueryParams: cultureParams(session.getLanguage()) }),

    logout: async (queryParams?: Record<string, string>): Promise<void> => {
      rememberMe.remove();

      // A host that only wants the local session gone -- an impersonation ending, say --
      // would otherwise be bounced through the identity server and back.
      if (queryParams?.noRedirectToLogoutUrl) {
        // Same as the password flow: a refused revocation does not keep the user in.
        await userManager()
          .revokeTokens()
          .catch(() => undefined);
        await userManager().removeUser();
        await configState.refreshAppState();
        await navigation.go('/');
        return;
      }

      await userManager().signoutRedirect({
        extraQueryParams: { ...cultureParams(session.getLanguage()), ...queryParams },
      });
    },

    refresh: async (): Promise<void> => {
      await userManager().signinSilent();
    },

    clear: async (): Promise<void> => {
      rememberMe.remove();
      await userManager().removeUser();
      await userManager().clearStaleState();
    },
  };
});
export type AuthCodeFlowStrategy = ServiceOf<typeof AuthCodeFlowStrategy>;
