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
  type ApplicationConfiguration,
  type ServiceOf,
  onServiceDestroy,
} from '@lsw-abpvue/core';
import { UserManager, User, type UserManagerSettings } from 'oidc-client-ts';
import type { TokenResponse } from '../models/oauth.js';
import { AuthError } from '@lsw-abpvue/core';
import { decodeJwt } from '../utils/jwt.js';
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
import type { AuthFlowStrategy, StoredAuthSession } from './strategy.js';

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
  isActive: () => boolean = () => true,
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
    stateStore: new TokenStateStore(storage, 'oidc.', isActive),
    userStore: new TokenStateStore(storage, 'oidc.user.', isActive),
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
  let generation = 0;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  onServiceDestroy(() => {
    clearTimeout(expiry);
    retire();
  });

  function retire(): void {
    generation += 1;
    clearTimeout(expiry);
    manager?.stopSilentRenew?.();
    manager = undefined;
  }

  function createManager(
    tenantId: string | null | undefined = session.getTenant()?.id,
  ): UserManager {
    const own = generation;
    const settings = buildSettings(
      environment.getEnvironment().oAuthConfig ?? {},
      storage,
      tenantId ? { key: tenantKey, id: tenantId } : undefined,
      () => own === generation,
    );
    const next = create({ ...settings, automaticSilentRenew: false });
    next.events.addUserLoaded(user => {
      if (own === generation) adopt(user);
    });
    next.events.addUserUnloaded(() => {
      if (own === generation) state.set(null);
    });
    return next;
  }

  function userManager(): UserManager {
    if (manager) return manager;

    manager = createManager();
    return manager;
  }

  function adopt(user: User): void {
    clearTimeout(expiry);
    if (user.profile?.abpvue_grant_session === true && !user.refresh_token) {
      manager?.stopSilentRenew?.();
      if (user.expires_at !== undefined) {
        const own = generation;
        const expiresAt = user.expires_at * 1000;
        const schedule = (): void => {
          expiry = setTimeout(
            () => {
              if (own !== generation) return;
              if (expiresAt > Date.now()) {
                schedule();
                return;
              }
              state.set(null);
              configState.clearIdentity();
              void clearLocal().catch(() => undefined);
            },
            Math.min(Math.max(expiresAt - Date.now(), 0), 2_147_483_647),
          );
        };
        schedule();
      }
    } else manager?.startSilentRenew?.();
    const explicitBinding = user.profile?.abpvue_tenant_id;
    const saved = state.readStored();
    const binding =
      explicitBinding === undefined
        ? (user.profile?.tenantid ??
          decodeJwt(user.access_token)?.tenantid ??
          (saved?.accessToken === user.access_token ? saved.tenantId : undefined))
        : explicitBinding;
    state.set({
      accessToken: user.access_token,
      refreshToken: user.refresh_token,
      expiresAt: user.expires_at === undefined ? Infinity : user.expires_at * 1000,
      ...(binding === null || typeof binding === 'string' ? { tenantId: binding } : {}),
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

  async function clearLocal(): Promise<void> {
    rememberMe.remove();
    retire();
    const own = generation;
    const next = createManager(undefined);
    manager = next;
    try {
      await next.removeUser();
      if (own !== generation) return;
      await next.clearStaleState();
    } finally {
      if (own === generation) state.persist(null);
    }
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

      if (user.expired && user.profile?.abpvue_grant_session === true && !user.refresh_token) {
        await clearLocal();
        return;
      }

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

    navigateToLogin: async (
      returnUrl?: string,
      queryParams?: Readonly<Record<string, string>>,
    ): Promise<void> => {
      await userManager().signinRedirect({
        ...(returnUrl ? { state: returnUrl } : {}),
        extraQueryParams: { ...queryParams, ...cultureParams(session.getLanguage()) },
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
        const revocation = userManager()
          .revokeTokens()
          .catch(() => undefined);
        retire();
        const own = generation;
        await revocation;
        if (own !== generation) return;
        manager = createManager(undefined);
        await manager.removeUser();
        state.persist(null);
        await configState.refreshAppState();
        if (own !== generation) return;
        await navigation.go('/');
        return;
      }

      const previous = userManager();
      const storedUser = previous.getUser().catch(() => null);
      const revocation = previous.revokeTokens().catch(() => undefined);
      retire();
      const own = generation;
      try {
        state.persist(null);
      } finally {
        const next = createManager(undefined);
        manager = next;
        try {
          await next.removeUser();
          if (own === generation) await next.clearStaleState();
        } finally {
          if (own === generation) state.persist(null);
        }
      }
      const [user] = await Promise.all([storedUser, revocation]);
      if (own !== generation) return;
      await previous.signoutRedirect({
        ...(user?.id_token ? { id_token_hint: user.id_token } : {}),
        extraQueryParams: { ...cultureParams(session.getLanguage()), ...queryParams },
      });
    },

    refresh: async (): Promise<void> => {
      const next = userManager();
      const own = generation;
      const user = await next.getUser();
      if (own !== generation) throw new AuthError('session_changed');
      if (user?.profile?.abpvue_grant_session === true && !user.refresh_token)
        throw new AuthError(
          'login_required',
          'This account session requires an explicit login after expiry.',
        );
      await next.signinSilent();
    },

    clear: clearLocal,

    prepareSession: async (
      response: TokenResponse,
      configuration: ApplicationConfiguration,
      customGrant = true,
    ): Promise<() => void> => {
      const subject = configuration.currentUser.id;
      if (!subject)
        throw new AuthError('invalid_grant', 'The replacement identity has no subject.');
      retire();
      const own = generation;
      const tenantId = configuration.currentTenant.id ?? null;
      manager = createManager(tenantId);
      const next = manager;
      const now = Math.floor(Date.now() / 1000);
      const user = new User({
        access_token: response.access_token,
        token_type: response.token_type ?? 'Bearer',
        ...(response.refresh_token ? { refresh_token: response.refresh_token } : {}),
        ...(response.id_token ? { id_token: response.id_token } : {}),
        ...(response.scope ? { scope: response.scope } : {}),
        ...(response.expires_in === undefined ? {} : { expires_at: now + response.expires_in }),
        profile: {
          iss: environment.getEnvironment().oAuthConfig?.issuer ?? '',
          sub: subject,
          aud: environment.getEnvironment().oAuthConfig?.clientId ?? '',
          iat: now,
          exp: now + (response.expires_in ?? 3600),
          ...((configuration.currentUser.name ?? configuration.currentUser.userName)
            ? { name: configuration.currentUser.name ?? configuration.currentUser.userName ?? '' }
            : {}),
          abpvue_tenant_id: tenantId,
          abpvue_grant_session: customGrant,
        },
      });
      await next.storeUser(user);
      if (own !== generation) throw new AuthError('session_changed');
      await next.events.load?.(user, false);
      return () => {
        if (own !== generation) throw new AuthError('session_changed');
        adopt(user);
        rememberMe.set(rememberMe.fromToken(user.access_token));
      };
    },

    readSession: async (): Promise<StoredAuthSession | null> => {
      retire();
      manager = createManager(undefined);
      const own = generation;
      const user = await manager.getUser();
      if (own !== generation) throw new AuthError('session_changed');
      if (!user) return null;
      return {
        customGrant: user.profile?.abpvue_grant_session === true,
        response: {
          access_token: user.access_token,
          refresh_token: user.refresh_token,
          id_token: user.id_token,
          token_type: user.token_type,
          scope: user.scope,
          expires_in: user.expires_in,
        },
      };
    },
  };
});
export type AuthCodeFlowStrategy = ServiceOf<typeof AuthCodeFlowStrategy>;
