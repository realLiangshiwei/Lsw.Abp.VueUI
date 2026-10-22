import {
  AbpHttpError,
  AuthError,
  AuthErrorFilterService,
  clearListPreferences,
  ConfigStateService,
  defineService,
  EnvironmentService,
  inject,
  StorageService,
  SessionStateService,
  TokenStorage,
  onServiceDestroy,
  type AuthGrantOptions,
  type AuthGrantResult,
  type ApplicationConfiguration,
  type AuthService,
  type LoginParams,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { AuthCodeFlowStrategy } from '../strategies/auth-code-flow.strategy.js';
import { PasswordFlowStrategy } from '../strategies/password-flow.strategy.js';
import type { AuthFlowStrategy } from '../strategies/strategy.js';
import { AuthStateService } from './auth-state.service.js';
import { toTokens } from './auth-state.service.js';
import { TokenEndpointService } from './token-endpoint.service.js';
import { AuthNavigationService } from './auth-navigation.service.js';
import type { TokenResponse } from '../models/oauth.js';
import { decodeJwt } from '../utils/jwt.js';

function issuerAddress(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return undefined;
    return value === url.origin || value === `${url.origin}/` ? `${url.origin}/` : value;
  } catch {
    return undefined;
  }
}

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
  const storage = inject(StorageService);
  const code = inject(AuthCodeFlowStrategy);
  const password = inject(PasswordFlowStrategy);
  const endpoint = inject(TokenEndpointService);
  const session = inject(SessionStateService);
  const navigation = inject(AuthNavigationService);
  const tokenStorage = inject(TokenStorage);
  let revision = 0;
  let changing = false;
  let synchronizing = false;
  let synchronizationEpoch = 0;
  let stopStorage: (() => void) | undefined;
  onServiceDestroy(() => stopStorage?.());

  function validateDestination(options: AuthGrantOptions, response?: TokenResponse): void {
    const destination = options.redirectUrl;
    if (
      destination &&
      (!destination.startsWith('/') ||
        destination.startsWith('//') ||
        destination.includes('\\') ||
        [...destination].some(character => character.charCodeAt(0) <= 32))
    )
      throw new AuthError(
        'invalid_request',
        'The authentication return path must stay inside this application.',
      );
    if (!response?.tenant_domain) return;
    let origin: string;
    try {
      const url = new URL(response.tenant_domain);
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      )
        throw new TypeError('Invalid tenant origin');
      origin = url.origin;
    } catch {
      throw new AuthError(
        'invalid_grant',
        'The authentication server returned an invalid tenant origin.',
      );
    }
    if (!options.allowedTenantOrigins?.includes(origin))
      throw new AuthError(
        'invalid_grant',
        'The replacement tenant origin is not trusted by this application.',
      );
  }

  function checkRevision(own: number): void {
    if (own !== revision)
      throw new AuthError(
        'session_changed',
        'The session changed before authentication completed.',
      );
  }

  async function candidate(
    response: TokenResponse,
    options: AuthGrantOptions,
  ): Promise<ApplicationConfiguration> {
    if (
      typeof response.access_token !== 'string' ||
      !response.access_token ||
      (response.token_type !== undefined &&
        (typeof response.token_type !== 'string' ||
          response.token_type.toLowerCase() !== 'bearer')) ||
      (response.expires_in !== undefined &&
        (!Number.isFinite(response.expires_in) || response.expires_in <= 0))
    )
      throw new AuthError(
        'invalid_grant',
        'The authentication server returned an unusable session.',
      );
    const configuration = await configState.readAppState({
      headers: {
        Authorization: `Bearer ${response.access_token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      skipAuthorization: true,
      skipAddingHeader: true,
      skipHandleError: true,
    });
    if (!configuration.currentUser?.isAuthenticated || !configuration.currentUser.id)
      throw new AuthError('invalid_grant', 'The replacement session is not authenticated.');
    if (
      options.tenant !== undefined &&
      (configuration.currentTenant.id ?? null) !== (options.tenant?.id ?? null)
    )
      throw new AuthError('invalid_grant', 'The replacement session belongs to another tenant.');
    if (response.id_token) {
      const claims = decodeJwt(response.id_token);
      const config = environment.getEnvironment().oAuthConfig;
      const audience = claims?.aud;
      const expectedIssuer = issuerAddress(config?.issuer);
      if (
        !claims ||
        !expectedIssuer ||
        !config?.clientId ||
        claims.sub !== configuration.currentUser.id ||
        issuerAddress(claims.iss) !== expectedIssuer ||
        !(
          audience === config?.clientId ||
          (Array.isArray(audience) && audience.includes(config?.clientId))
        )
      )
        throw new AuthError(
          'invalid_grant',
          'The replacement OpenID subject does not match the verified identity.',
        );
    }
    return configuration;
  }

  async function commit(
    response: TokenResponse,
    configuration: ApplicationConfiguration,
    own: number,
    customGrant = true,
  ): Promise<void> {
    const flow = strategy();
    if (!flow.prepareSession) throw new AuthError('unsupported_grant_type');
    let commitStarted = false;
    try {
      const prepared = await flow.prepareSession(response, configuration, customGrant);
      checkRevision(own);
      commitStarted = true;
      clearListPreferences(storage, configState.snapshot().currentUser.id);
      prepared();
      state.persist({ ...toTokens(response), tenantId: configuration.currentTenant.id ?? null });
      revision += 1;
      session.setTenant(configuration.currentTenant.id ? configuration.currentTenant : null);
      configState.setState(configuration);
    } catch (error) {
      if (own === revision || (commitStarted && own + 1 === revision)) {
        revision += 1;
        state.set(null);
        configState.clearIdentity();
        await flow.clear();
        await configState.refreshAppState();
      }
      throw error;
    }
  }

  const strategy = (): AuthFlowStrategy =>
    environment.getEnvironment().oAuthConfig?.responseType === 'code' ? code : password;

  async function synchronizeSession(): Promise<void> {
    const epoch = ++synchronizationEpoch;
    const own = ++revision;
    synchronizing = true;
    clearListPreferences(storage, configState.snapshot().currentUser.id);
    state.set(null);
    configState.clearIdentity();
    try {
      const stored = await strategy().readSession?.();
      checkRevision(own);
      if (!stored) {
        await strategy().clear();
        checkRevision(own);
        await configState.refreshAppState();
        return;
      }
      const configuration = await candidate(stored.response, {});
      checkRevision(own);
      await commit(stored.response, configuration, own, stored.customGrant);
    } catch (error) {
      if (own !== revision) return;
      state.set(null);
      configState.clearIdentity();
      await strategy().clear();
      await configState.refreshAppState();
      throw error;
    } finally {
      if (epoch === synchronizationEpoch) synchronizing = false;
    }
  }

  async function clearSession(): Promise<void> {
    synchronizationEpoch += 1;
    synchronizing = false;
    revision += 1;
    clearListPreferences(storage, configState.snapshot().currentUser.id);
    configState.clearIdentity();
    try {
      state.persist(null);
    } finally {
      await strategy().clear();
    }
    await configState.refreshAppState();
  }

  return {
    get sessionRevision(): number {
      return revision;
    },
    get isSynchronizingSession(): boolean {
      return synchronizing;
    },
    isAuthenticated: state.isAuthenticated,
    get isInternalAuth(): boolean {
      return strategy().isInternalAuth;
    },

    init: async (): Promise<void> => {
      await strategy().init();
      if (stopStorage || !tokenStorage.onChange) return;
      let queued = false;
      stopStorage = tokenStorage.onChange((key, value) => {
        const codeFlow = !strategy().isInternalAuth;
        const config = environment.getEnvironment().oAuthConfig;
        const userKey = `oidc.user.user:${config?.issuer ?? ''}:${config?.clientId ?? ''}`;
        if (key !== null && (codeFlow ? key !== userKey : key !== 'access_token')) return;
        if (value && state.getAccessToken()) {
          if (!codeFlow && value === state.getAccessToken()) return;
          if (codeFlow) {
            try {
              const saved: unknown = JSON.parse(value);
              if (
                saved &&
                typeof saved === 'object' &&
                'access_token' in saved &&
                saved.access_token === state.getAccessToken()
              )
                return;
            } catch {
              // A malformed external session is reconciled as unauthenticated.
            }
          }
        }
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
          queued = false;
          // External writes have no caller; the protected requests report any read failure.
          void synchronizeSession().catch(() => undefined);
        });
      });
    },
    navigateToLogin: (
      returnUrl?: string,
      queryParams?: Readonly<Record<string, string>>,
    ): Promise<void> => strategy().navigateToLogin(returnUrl, queryParams),
    login: (params: LoginParams): Promise<void> => {
      revision += 1;
      return strategy().login(params);
    },
    logout: (queryParams?: Record<string, string>): Promise<void> => {
      revision += 1;
      clearListPreferences(storage, configState.snapshot().currentUser.id);
      const ending = strategy().logout(queryParams);
      state.set(null);
      configState.clearIdentity();
      return ending;
    },

    clearSession,
    synchronizeSession,

    loginUsingGrant: async (
      grantType: string,
      parameters: Readonly<Record<string, string>>,
      options: AuthGrantOptions = {},
    ): Promise<AuthGrantResult> => {
      validateDestination(options);
      const source = state.getAccessToken();
      if (!source || changing)
        throw new AuthError(
          'invalid_request',
          'Another session transition is pending or authentication is required.',
        );
      const own = revision;
      changing = true;
      try {
        const response = await endpoint.grant(grantType, parameters, source);
        checkRevision(own);
        validateDestination(options, response);
        const configuration = await candidate(response, options);
        checkRevision(own);
        await commit(response, configuration, own);
        if (options.redirectUrl) {
          await navigation.go(options.redirectUrl);
        }
        return typeof response.tenant_domain === 'string'
          ? { tenantDomain: response.tenant_domain }
          : {};
      } finally {
        changing = false;
      }
    },

    getAccessToken: (): string | null => state.getAccessToken(),
    getRefreshToken: (): string | null => state.getRefreshToken(),

    /**
     * A failed renewal is the session ending, unless a filter claims it. Ending it means
     * dropping the tokens, telling the backend to describe an anonymous visitor, and
     * sending the user where they can log in again.
     */
    refreshToken: async (): Promise<void> => {
      const own = revision;
      try {
        await strategy().refresh();
      } catch (error) {
        if (own !== revision) throw error;
        if (error instanceof AbpHttpError && filters.run(error)) throw error;

        clearListPreferences(storage, configState.snapshot().currentUser.id);
        revision += 1;
        configState.clearIdentity();
        await strategy().clear();
        await configState.refreshAppState();
        await strategy().navigateToLogin();
        throw error;
      }
    },
  } satisfies AuthService & {
    readonly sessionRevision: number;
    readonly isSynchronizingSession: boolean;
    synchronizeSession(): Promise<void>;
    getRefreshToken(): string | null;
  };
});
export type AbpOAuthService = ServiceOf<typeof AbpOAuthService>;
