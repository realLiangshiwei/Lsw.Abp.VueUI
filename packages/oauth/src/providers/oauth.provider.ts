import {
  CHECK_AUTHENTICATION_STATE_FN,
  collectFeatures,
  ConfigStateService,
  defineFeature,
  EnvironmentService,
  HTTP_INTERCEPTORS,
  inject,
  makeEnvironmentProviders,
  NAVIGATE_TO_MANAGE_PROFILE,
  PIPE_TO_LOGIN_FN,
  provideAppInitializer,
  SessionStateService,
  TokenStorage,
  WindowService,
  AuthService,
  onServiceDestroy,
  type CheckAuthenticationStateFn,
  type EnvironmentProviders,
  type Feature,
  type InjectionToken,
  type PipeToLoginFn,
} from '@lsw-abpvue/core';
import { authInterceptor } from '../interceptors/auth.interceptor.js';
import { AbpOAuthService } from '../services/abp-oauth.service.js';
import { AuthNavigationService } from '../services/auth-navigation.service.js';
import { AuthStateService } from '../services/auth-state.service.js';
import { decodeJwt } from '../utils/jwt.js';

/** ABP puts the tenant a token was issued for in this claim; a host token has none. */
const TENANT_CLAIM = 'tenantid';

export type OAuthFeature = Feature<'withTokenStorage'>;

/** Reloads the configuration, then goes where the login form said to go. */
function pipeToLogin(): PipeToLoginFn {
  const configState = inject(ConfigStateService);
  const navigation = inject(AuthNavigationService);

  return async params => {
    await configState.refreshAppState();
    if (params.redirectUrl) await navigation.go(params.redirectUrl);
  };
}

/**
 * A token can outlive what it stands for -- the user was deleted, the tenant disabled,
 * the signing key rotated. The backend answers such a request as an anonymous visitor
 * rather than with a 401, so holding a token while the configuration describes nobody is
 * the only way to notice.
 */
function checkAccessToken(): CheckAuthenticationStateFn {
  const oauth = inject(AbpOAuthService);
  const configState = inject(ConfigStateService);
  const state = inject(AuthStateService);

  return () => {
    if (!oauth.getAccessToken()) return;
    if (configState.snapshot().currentUser.id) {
      state.bindTenant(configState.snapshot().currentTenant.id ?? null);
      return;
    }
    void oauth.clearSession().catch(() => undefined);
  };
}

/** The OAuth default opens the identity server's profile page; account config overrides it. */
function navigateToManageProfile(): () => void {
  const environment = inject(EnvironmentService);
  const windowService = inject(WindowService);

  return () => {
    const issuer = environment.getEnvironment().oAuthConfig?.issuer;
    const here = windowService.nativeWindow?.location.href;
    if (!issuer || !here) return;

    const base = issuer.endsWith('/') ? issuer : `${issuer}/`;
    windowService.open(`${base}Account/Manage?returnUrl=${encodeURIComponent(here)}`, '_self');
  };
}

/**
 * A token belongs to one tenant. Switching tenants -- here, or in another tab -- makes
 * the one being held the wrong token, so it goes and the backend is asked again who the
 * visitor now is. The claim is what decides, not the moment: at startup the stored token
 * and the resolved tenant agree, and nothing happens.
 */
function dropTokenOfAnotherTenant(): void {
  const session = inject(SessionStateService);
  const state = inject(AuthStateService);
  const oauth = inject(AbpOAuthService);
  const storage = inject(TokenStorage);
  const stop = session.onTenantChange(tenant => {
    if (oauth.isSynchronizingSession) return;
    const token = state.getAccessToken();
    if (!token) return;
    const claims = decodeJwt(token);
    const issuedFor =
      state.getTenantId() === undefined
        ? claims
          ? (claims[TENANT_CLAIM] ?? null)
          : undefined
        : state.getTenantId();
    if (issuedFor === (tenant?.id ?? null)) return;
    const saved = state.readStored();
    if (storage.onChange && saved && saved.accessToken !== token) {
      void oauth.synchronizeSession().catch(() => undefined);
      return;
    }
    // A listener has no caller; a later protected request reports the unavailable session.
    void oauth.clearSession().catch(() => undefined);
  });
  onServiceDestroy(stop);
}

/**
 * Everything `@lsw-abpvue/oauth` puts in the root injector: the `AuthService` the
 * framework asks for, and the interceptor that carries its token.
 * @param features `withXxx()` results
 */
export function provideAbpOAuth(...features: OAuthFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthService, useExisting: AbpOAuthService },
    // Last in the chain, so the tenant, language and timezone headers are already on the
    // request it may have to replay.
    { provide: HTTP_INTERCEPTORS, multi: true, useFactory: authInterceptor },
    { provide: PIPE_TO_LOGIN_FN, useFactory: pipeToLogin },
    { provide: CHECK_AUTHENTICATION_STATE_FN, useFactory: checkAccessToken },
    { provide: NAVIGATE_TO_MANAGE_PROFILE, useFactory: navigateToManageProfile },
    provideAppInitializer(dropTokenOfAnotherTenant),
    ...collectFeatures('provideAbpOAuth()', features),
  ]);
}

/**
 * Keeps tokens somewhere other than local storage.
 * @param storage Token of the replacement, so it can inject what it needs
 */
export function withTokenStorage(storage: InjectionToken<TokenStorage>): OAuthFeature {
  return defineFeature('withTokenStorage', [{ provide: TokenStorage, useExisting: storage }]);
}
