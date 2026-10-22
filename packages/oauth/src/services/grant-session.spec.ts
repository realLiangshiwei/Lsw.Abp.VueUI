import {
  APP_INITIALIZERS,
  AuthService,
  ConfigStateService,
  createInjector,
  HTTP_FETCH,
  LocalizationService,
  MemoryTokenStorage,
  PermissionService,
  provideAbpCore,
  RestService,
  RoutesService,
  runInInjectionContext,
  SessionStateService,
  StorageService,
  TokenStorage,
  WindowService,
  withOptions,
  type ApplicationConfigurationDto,
  type CurrentTenantDto,
  type FetchLike,
  type Injector,
} from '@lsw-abpvue/core';
import { User, UserManager, type UserManagerSettings } from 'oidc-client-ts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { provideAbpOAuth } from '../providers/oauth.provider.js';
import { buildSettings, USER_MANAGER_FACTORY } from '../strategies/auth-code-flow.strategy.js';
import { AuthStateService } from './auth-state.service.js';
import { AbpOAuthService } from './abp-oauth.service.js';

const issuer = 'https://issuer.example.test';
const application = 'https://app.example.test';
const tenantA: CurrentTenantDto = { id: 'tenant-a', name: 'Tenant A', isAvailable: true };
const tenantB: CurrentTenantDto = { id: 'tenant-b', name: 'Tenant B', isAvailable: true };
const oldToken = 'access-token-a';
const newToken = 'access-token-b';
const oldIdToken = 'id-token-a';
const userKey = `user:${issuer}:GrantTests`;
const injectors: Injector[] = [];
afterEach(() => {
  for (const injector of injectors.splice(0)) injector.destroy();
  vi.useRealTimers();
});

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new TypeError('The deferred operation is unavailable.');
  };
  let reject: (reason: unknown) => void = () => {
    throw new TypeError('The deferred operation is unavailable.');
  };
  const promise = new Promise<T>((complete, fail) => {
    resolve = complete;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function configuration(subject: 'a' | 'b' | 'anonymous'): ApplicationConfigurationDto {
  const fixture = configurationFixture as unknown as ApplicationConfigurationDto;
  return {
    ...fixture,
    currentUser: {
      ...fixture.currentUser,
      id: subject === 'anonymous' ? null : `user-${subject}`,
      userName: subject === 'anonymous' ? null : `User ${subject.toUpperCase()}`,
      isAuthenticated: subject !== 'anonymous',
    },
    currentTenant: subject === 'b' ? tenantB : subject === 'a' ? tenantA : { isAvailable: false },
    auth: {
      grantedPolicies:
        subject === 'anonymous' ? {} : { [subject === 'a' ? 'OnlyA' : 'OnlyB']: true },
    },
    localization: {
      ...fixture.localization,
      currentCulture: { ...fixture.localization.currentCulture, cultureName: 'en' },
      resources: { Session: { baseResources: [], texts: { Label: subject.toUpperCase() } } },
      values: { Session: { Label: subject.toUpperCase() } },
    },
  };
}
function oidcUser(
  subject: 'a' | 'b',
  token = subject === 'a' ? oldToken : newToken,
  binding?: string | null,
): User {
  return new User({
    access_token: token,
    refresh_token: `refresh-token-${subject}`,
    token_type: 'Bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    ...(subject === 'a' ? { id_token: oldIdToken } : {}),
    profile: {
      sub: `user-${subject}`,
      name: `User ${subject.toUpperCase()}`,
      iss: issuer,
      aud: 'GrantTests',
      iat: 1,
      exp: 9999999999,
      ...(binding === undefined ? {} : { abpvue_tenant_id: binding }),
    },
  });
}

function manager(settings: UserManagerSettings, initial: User | null) {
  let stored = initial;
  const loaded = new Set<(user: User) => void>();
  const unloaded = new Set<() => void>();
  const storeUser = vi.fn(async (user: User | null) => {
    stored = user;
    if (user) await settings.userStore?.set(userKey, user.toStorageString());
    else await settings.userStore?.remove(userKey);
  });
  const removeUser = vi.fn(async () => {
    await storeUser(null);
    for (const listener of unloaded) listener();
  });
  const instance = {
    settings,
    events: {
      addUserLoaded: (listener: (user: User) => void) => {
        loaded.add(listener);
      },
      removeUserLoaded: (listener: (user: User) => void) => {
        loaded.delete(listener);
      },
      addUserUnloaded: (listener: () => void) => {
        unloaded.add(listener);
      },
      removeUserUnloaded: (listener: () => void) => {
        unloaded.delete(listener);
      },
    },
    getUser: vi.fn(async () => {
      if (stored) return stored;
      const serialized = await settings.userStore?.get(userKey);
      return serialized ? User.fromStorageString(serialized) : null;
    }),
    storeUser,
    removeUser,
    signinSilent: vi.fn(() => Promise.resolve(stored)),
    signinCallback: vi.fn(() => Promise.resolve(stored)),
    signinRedirect: vi.fn(() => Promise.resolve()),
    signoutRedirect: vi.fn(async () => {
      await removeUser();
    }),
    revokeTokens: vi.fn(() => Promise.resolve()),
    clearStaleState: vi.fn(() => Promise.resolve()),
    stopSilentRenew: vi.fn(),
    startSilentRenew: vi.fn(),
  };
  // The factory is the public boundary to the OIDC library; these are the methods used by the flow.
  return { settings, loaded, unloaded, instance, value: instance as unknown as UserManager };
}

interface Exchange {
  path: string;
  method: string;
  headers: Headers;
  form: URLSearchParams | undefined;
}
interface HarnessOptions {
  initialOidcUser?: User | undefined;
  configuredIssuer?: string | undefined;
  grant?: ReturnType<typeof deferred<Response>> | undefined;
  candidateConfiguration?: ReturnType<typeof deferred<Response>> | undefined;
  candidateConfigurationFails?: boolean | undefined;
  anonymousConfigurationFails?: boolean | undefined;
  anonymousConfiguration?: ReturnType<typeof deferred<Response>> | undefined;
  candidateConfigurations?: ReturnType<typeof deferred<Response>>[] | undefined;
  failCandidateStore?: boolean | undefined;
  candidateLocalizationFails?: boolean | undefined;
  refused?: boolean | undefined;
  mutation?: ReturnType<typeof deferred<Response>> | undefined;
  externalStore?: boolean | undefined;
  initializeProvider?: boolean | undefined;
  binding?: string | null | undefined;
}
type GrantAuth = AuthService;
function externalStorage() {
  const values = new Map<string, string>();
  const listeners = new Set<(key: string | null, value: string | null) => void>();
  const storage = {
    getItem: (key: string): string | null => values.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
    removeItem: (key: string): void => {
      values.delete(key);
    },
    keys: (): string[] => [...values.keys()],
    onChange: (listener: (key: string | null, value: string | null) => void): (() => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    storage,
    emit: (key: string | null, value: string | null): void => {
      if (key === null) values.clear();
      else if (value === null) values.delete(key);
      else values.set(key, value);
      for (const listener of listeners) listener(key, value);
    },
  };
}

async function app(options: HarnessOptions = {}) {
  const initialBinding = Object.hasOwn(options, 'binding') ? options.binding : 'tenant-a';
  const initialTenant = initialBinding === null ? null : tenantA;
  const chosenStore = externalStorage();
  const generalStore = externalStorage();
  const candidateQueue = options.candidateConfigurations?.slice() ?? [];
  const exchanges: Exchange[] = [];
  const managers: ReturnType<typeof manager>[] = [];
  const visited: string[] = [];
  const send: FetchLike = async (address, init) => {
    const path = new URL(String(address)).pathname;
    const headers = new Headers(init?.headers);
    const form = path === '/connect/token' ? new URLSearchParams(String(init?.body)) : undefined;
    exchanges.push({ path, method: init?.method ?? 'GET', headers, form });
    if (path.endsWith('/.well-known/openid-configuration'))
      return json({ token_endpoint: `${issuer}/connect/token` });
    if (path === '/connect/token') {
      if (options.grant) return options.grant.promise;
      return options.refused
        ? json({ error: 'invalid_grant', error_description: 'Grant refused' }, 400)
        : json({
            access_token: newToken,
            refresh_token: 'refresh-token-b',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'openid profile offline_access',
          });
    }
    if (path === '/api/abp/application-configuration') {
      if (headers.get('Authorization') === `Bearer ${newToken}`) {
        const queued = candidateQueue.shift();
        if (queued) return queued.promise;
        if (options.candidateConfiguration) return options.candidateConfiguration.promise;
        if (options.candidateConfigurationFails)
          return json({ error: { message: 'Candidate unavailable' } }, 503);
        return json(configuration('b'));
      }
      if (!headers.has('Authorization')) {
        if (options.anonymousConfiguration) return options.anonymousConfiguration.promise;
        if (options.anonymousConfigurationFails)
          return json({ error: { message: 'Anonymous configuration unavailable' } }, 503);
      }
      return json(
        configuration(headers.get('Authorization') === `Bearer ${oldToken}` ? 'a' : 'anonymous'),
      );
    }
    if (path === '/api/abp/application-localization') {
      if (
        headers.get('Authorization') === `Bearer ${newToken}` &&
        options.candidateLocalizationFails
      )
        return json({ error: { message: 'Candidate texts unavailable' } }, 503);
      const subject =
        headers.get('Authorization') === `Bearer ${newToken}`
          ? 'b'
          : headers.get('Authorization') === `Bearer ${oldToken}`
            ? 'a'
            : 'anonymous';
      return json({
        resources: configuration(subject).localization.resources,
        currentCulture: configuration(subject).localization.currentCulture,
      });
    }
    if (path === '/api/identity/organization-units/source' && options.mutation)
      return options.mutation.promise;
    return json({});
  };
  const injector = createInjector([
    provideAbpCore(
      withOptions({
        skipGetAppConfiguration: true,
        skipInitAuthService: true,
        environment: {
          apis: { default: { url: issuer } },
          application: { name: 'GrantTests' },
          production: false,
          oAuthConfig: {
            issuer: options.configuredIssuer ?? issuer,
            clientId: 'GrantTests',
            scope: 'openid profile offline_access',
            responseType: 'code',
            redirectUri: `${application}/callback`,
          },
        },
      }),
    ),
    provideAbpOAuth(),
    options.externalStore
      ? { provide: TokenStorage, useValue: chosenStore.storage }
      : { provide: TokenStorage, useExisting: MemoryTokenStorage },
    { provide: StorageService, useValue: generalStore.storage },
    { provide: HTTP_FETCH, useValue: send },
    {
      provide: USER_MANAGER_FACTORY,
      useValue: (settings: UserManagerSettings) => {
        const value = manager(
          settings,
          managers.length === 0
            ? (options.initialOidcUser ?? oidcUser('a', oldToken, initialBinding))
            : null,
        );
        if (options.failCandidateStore && managers.length > 0) {
          const original = value.instance.storeUser.getMockImplementation();
          if (!original) throw new TypeError('The OIDC user storage operation is unavailable.');
          value.instance.storeUser.mockImplementation(async user => {
            if (user?.access_token === newToken)
              throw new TypeError('The replacement user could not be persisted.');
            await original(user);
          });
        }
        managers.push(value);
        return value.value;
      },
    },
    {
      provide: WindowService,
      useValue: {
        nativeWindow: {
          location: {
            href: `${application}/identity/users`,
            assign: (url: string) => visited.push(url),
          },
          history: {
            replaceState: (_state: unknown, _unused: string, url: string) => visited.push(url),
          },
        } as unknown as Window,
        open: () => {},
      },
    },
  ]);
  injectors.push(injector);
  generalStore.storage.setItem('abpSession', JSON.stringify({ tenant: initialTenant }));
  injector.get(SessionStateService).setTenant(initialTenant);
  injector
    .get(ConfigStateService)
    .setState({ ...configuration('a'), currentTenant: initialTenant ?? { isAvailable: false } });
  injector.get(AuthStateService).persist({
    accessToken: oldToken,
    refreshToken: 'refresh-token-a',
    expiresAt: Date.now() + 3600_000,
    ...(initialBinding === undefined ? {} : { tenantId: initialBinding }),
  });
  injector
    .get(TokenStorage)
    .setItem(
      `oidc.user.${userKey}`,
      (options.initialOidcUser ?? oidcUser('a', oldToken, initialBinding)).toStorageString(),
    );
  if (options.initializeProvider) {
    for (const initializer of injector.get(APP_INITIALIZERS))
      await runInInjectionContext(injector, initializer);
  }
  const routes = injector.get(RoutesService);
  routes.add([
    { name: 'A', path: '/a', requiredPolicy: 'OnlyA' },
    { name: 'B', path: '/b', requiredPolicy: 'OnlyB' },
  ]);
  const auth: GrantAuth = injector.get(AuthService);
  expect(typeof auth.loginUsingGrant).toBe('function');
  await auth.init();
  const oldManager = managers[0];
  if (!oldManager) throw new TypeError('The authorization code manager was not initialized.');
  return {
    injector,
    auth,
    exchanges,
    managers,
    oldManager,
    routes,
    visited,
    chosenStore,
    generalStore,
  };
}
async function switchUser(harness: Awaited<ReturnType<typeof app>>) {
  const login = harness.auth.loginUsingGrant;
  if (!login)
    throw new TypeError(
      'The authentication service must implement the custom grant session transition.',
    );
  return login('Impersonation', { UserId: 'user-b', TenantId: 'tenant-b' }, { tenant: tenantB });
}
function assertOriginal(harness: Awaited<ReturnType<typeof app>>) {
  expect(harness.auth.getAccessToken()).toBe(oldToken);
  expect(harness.injector.get(TokenStorage).getItem('access_token')).toBe(oldToken);
  expect(harness.injector.get(SessionStateService).getTenant()).toEqual(tenantA);
  expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-a');
  expect(harness.routes.visible.value.map(route => route.name)).toEqual(['A']);
}

describe('custom grant session transitions', () => {
  it('does not let a late anonymous configuration response from local logout navigate a newer OIDC session', async () => {
    const anonymous = deferred<Response>();
    const harness = await app({ externalStore: true, anonymousConfiguration: anonymous });
    const ending = harness.auth.logout({ noRedirectToLogoutUrl: 'true' });
    await vi.waitFor(() =>
      expect(
        harness.exchanges.some(
          exchange =>
            exchange.path.endsWith('/application-configuration') &&
            !exchange.headers.has('Authorization'),
        ),
      ).toBe(true),
    );
    harness.chosenStore.emit(`oidc.user.${userKey}`, oidcUser('b').toStorageString());
    await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBe(newToken));
    anonymous.resolve(json(configuration('anonymous')));
    await ending;

    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
    expect(harness.visited).not.toContain('/');
  });

  it.each([
    {
      name: 'bare-origin slash',
      configured: issuer,
      claims: { iss: `${issuer}/` },
      accepted: true,
    },
    {
      name: 'another issuer path',
      configured: issuer,
      claims: { iss: `${issuer}/realm` },
      accepted: false,
    },
    {
      name: 'rewritten non-root issuer path',
      configured: `${issuer}/realm`,
      claims: { iss: `${issuer}/other/../realm` },
      accepted: false,
    },
    { name: 'another subject', configured: issuer, claims: { sub: 'user-a' }, accepted: false },
    {
      name: 'another audience',
      configured: issuer,
      claims: { aud: 'another-client' },
      accepted: false,
    },
    { name: 'missing issuer', configured: issuer, claims: { iss: undefined }, accepted: false },
  ])('validates candidate OpenID binding for $name', async ({ configured, claims, accepted }) => {
    const grant = deferred<Response>();
    const harness = await app({ grant, configuredIssuer: configured });
    const transition = switchUser(harness);
    const payload = {
      iss: configured,
      sub: 'user-b',
      aud: 'GrantTests',
      exp: 9999999999,
      ...claims,
    };
    const encoded = btoa(JSON.stringify(payload))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    grant.resolve(
      json({
        access_token: newToken,
        refresh_token: 'refresh-token-b',
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: `e30.${encoded}.signature`,
      }),
    );

    if (accepted) {
      await transition;
      expect(harness.auth.getAccessToken()).toBe(newToken);
    } else {
      await expect(transition).rejects.toBeDefined();
      assertOriginal(harness);
    }
  });

  it('preserves normal OIDC renewal mode when synchronizing a non-grant session without a refresh token', async () => {
    const harness = await app({ externalStore: true });
    const initial = oidcUser('b');
    const normalUser = new User({
      access_token: initial.access_token,
      token_type: initial.token_type,
      ...(initial.expires_at === undefined ? {} : { expires_at: initial.expires_at }),
      profile: { ...initial.profile, abpvue_tenant_id: 'tenant-b' },
    });
    harness.chosenStore.emit(`oidc.user.${userKey}`, normalUser.toStorageString());
    await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBe(newToken));
    const replacement = harness.managers.at(-1);

    expect(replacement?.instance.startSilentRenew).toHaveBeenCalledOnce();
    await expect(harness.auth.refreshToken()).resolves.toBeUndefined();
    expect(replacement?.instance.signinSilent).toHaveBeenCalledOnce();
  });

  it('expires a custom-grant session without a refresh token without starting iframe renewal', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const grant = deferred<Response>();
    const harness = await app({ grant });
    const transition = switchUser(harness);
    grant.resolve(json({ access_token: newToken, token_type: 'Bearer', expires_in: 2 }));
    await transition;
    const replacement = harness.managers.at(-1);
    expect(replacement?.instance.startSilentRenew).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2001);

    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated).toBe(
      false,
    );
    expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull();
    expect(harness.injector.get(TokenStorage).getItem('access_token')).toBeNull();
    for (const item of harness.managers) expect(item.instance.signinSilent).not.toHaveBeenCalled();
  });

  it('rechecks a long custom-grant expiry after the platform timer limit rather than clearing early', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const grant = deferred<Response>();
    const harness = await app({ grant });
    const transition = switchUser(harness);
    const lifetime = 30 * 24 * 60 * 60;
    grant.resolve(json({ access_token: newToken, token_type: 'Bearer', expires_in: lifetime }));
    await transition;

    await vi.advanceTimersByTimeAsync(2_147_483_648);
    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
    await vi.advanceTimersByTimeAsync(lifetime * 1000 - 2_147_483_648 + 1001);
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull();
  });

  it('blocks manual iframe renewal of a custom-grant session without a refresh token', async () => {
    const grant = deferred<Response>();
    const harness = await app({ grant });
    const transition = switchUser(harness);
    grant.resolve(json({ access_token: newToken, token_type: 'Bearer', expires_in: 3600 }));
    await transition;

    await expect(harness.auth.refreshToken()).rejects.toBeDefined();

    expect(harness.auth.getAccessToken()).toBeNull();
    for (const item of harness.managers) expect(item.instance.signinSilent).not.toHaveBeenCalled();
  });

  it.each(['active', 'expired'] as const)(
    'retains the no-iframe restriction after reloading an %s persisted custom-grant session',
    async status => {
      const initial = oidcUser('b');
      const saved = new User({
        access_token: initial.access_token,
        token_type: initial.token_type,
        expires_at: Math.floor(Date.now() / 1000) + (status === 'active' ? 3600 : -1),
        profile: { ...initial.profile, abpvue_tenant_id: 'tenant-b', abpvue_grant_session: true },
      });
      const harness = await app({ initialOidcUser: saved });

      if (status === 'active') {
        expect(harness.auth.getAccessToken()).toBe(newToken);
        expect(harness.oldManager.instance.startSilentRenew).not.toHaveBeenCalled();
        await expect(harness.auth.refreshToken()).rejects.toBeDefined();
      }
      expect(harness.auth.getAccessToken()).toBeNull();
      expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull();
      for (const item of harness.managers)
        expect(item.instance.signinSilent).not.toHaveBeenCalled();
    },
  );

  it('uses the installed OIDC library user storage key in its external-session harness', async () => {
    const storage = externalStorage().storage;
    const settings = buildSettings({ issuer, clientId: 'GrantTests' }, storage);
    const manager = new UserManager({ ...settings, automaticSilentRenew: false });
    await manager.storeUser(oidcUser('a'));
    expect(storage.keys()).toEqual([`oidc.user.${userKey}`]);
    await manager.removeUser();
  });

  it('clears visible permissions and the OIDC user when one canonical token removal fails', async () => {
    const harness = await app({ externalStore: true });
    const storage = harness.chosenStore.storage;
    const remove = storage.removeItem;
    vi.spyOn(storage, 'removeItem').mockImplementationOnce(key => {
      if (key === 'access_token')
        throw new TypeError('The token storage is temporarily unavailable.');
      remove(key);
    });
    if (!harness.auth.clearSession)
      throw new TypeError('The local session clear capability is unavailable.');
    await expect(harness.auth.clearSession()).rejects.toBeDefined();
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated).toBe(
      false,
    );
    expect(harness.injector.get(ConfigStateService).snapshot().auth.grantedPolicies).toEqual({});
    expect(storage.getItem(`oidc.user.${userKey}`)).toBeNull();
  });

  it('clears an unusable external OIDC session without retaining old permissions', async () => {
    const harness = await app({ externalStore: true });
    harness.chosenStore.emit(`oidc.user.${userKey}`, '{');
    await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBeNull());
    await vi.waitFor(() =>
      expect(harness.injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated).toBe(
        false,
      ),
    );
    expect(harness.injector.get(ConfigStateService).snapshot().auth.grantedPolicies).toEqual({});
    expect(harness.routes.visible.value).toEqual([]);
  });

  it('removes the saved OIDC user during a normal redirect logout so a reload cannot restore it', async () => {
    const harness = await app();
    const storage = harness.injector.get(TokenStorage);
    expect(storage.getItem(`oidc.user.${userKey}`)).not.toBeNull();
    await harness.auth.logout();
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(storage.getItem(`oidc.user.${userKey}`)).toBeNull();
    expect(storage.getItem('access_token')).toBeNull();
  });

  it('removes the saved OIDC user even when a canonical token removal fails during redirect logout', async () => {
    const harness = await app({ externalStore: true });
    const storage = harness.chosenStore.storage;
    const remove = storage.removeItem;
    vi.spyOn(storage, 'removeItem').mockImplementationOnce(key => {
      if (key === 'access_token')
        throw new TypeError('The token storage is temporarily unavailable.');
      remove(key);
    });

    await harness.auth.logout().catch(() => undefined);

    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated).toBe(
      false,
    );
    expect(storage.getItem(`oidc.user.${userKey}`)).toBeNull();
    expect(harness.oldManager.instance.stopSilentRenew).toHaveBeenCalled();
    for (const key of ['access_token', 'refresh_token', 'expires_at', 'abpOAuthTenantBinding'])
      expect(storage.getItem(key)).toBeNull();
  });

  it.each(['redirect', 'local-only'] as const)(
    'does not let delayed %s logout cleanup remove a newer external session',
    async mode => {
      const harness = await app({ externalStore: true });
      const revocation = deferred<void>();
      harness.oldManager.instance.revokeTokens.mockImplementation(() => revocation.promise);
      const ending = harness.auth.logout(
        mode === 'local-only' ? { noRedirectToLogoutUrl: 'true' } : undefined,
      );
      await vi.waitFor(() =>
        expect(harness.oldManager.instance.revokeTokens).toHaveBeenCalledOnce(),
      );
      harness.chosenStore.emit(`oidc.user.${userKey}`, oidcUser('b').toStorageString());
      await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBe(newToken));

      revocation.resolve(undefined);
      await ending;

      expect(harness.auth.getAccessToken()).toBe(newToken);
      expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
      expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).not.toBeNull();
      expect(harness.oldManager.instance.signoutRedirect).not.toHaveBeenCalled();
      expect(harness.visited).not.toContain('/');
    },
  );

  it('clears the visible identity and permissions even when anonymous configuration cannot be refreshed', async () => {
    const harness = await app({ anonymousConfigurationFails: true });
    if (!harness.auth.clearSession)
      throw new TypeError('The local session clear capability is unavailable.');
    await expect(harness.auth.clearSession()).rejects.toBeDefined();
    expect(harness.auth.getAccessToken()).toBeNull();
    const configuration = harness.injector.get(ConfigStateService).snapshot();
    expect(configuration.currentUser.isAuthenticated).toBe(false);
    expect(configuration.currentUser.id).not.toBe('user-a');
    expect(configuration.auth.grantedPolicies).toEqual({});
    expect(configuration.features.values).toEqual({});
    expect(configuration.setting.values).toEqual({});
    expect(harness.routes.visible.value).toEqual([]);
  });

  it('ignores an external write of the active OIDC access token without republishing the session', async () => {
    const harness = await app({ externalStore: true });
    const requests = harness.exchanges.length;
    const managers = harness.managers.length;
    harness.chosenStore.emit(
      `oidc.user.${userKey}`,
      oidcUser('a', oldToken, 'tenant-a').toStorageString(),
    );
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assertOriginal(harness);
    expect(harness.exchanges).toHaveLength(requests);
    expect(harness.managers).toHaveLength(managers);
  });

  it('ignores an OIDC user event belonging to another client', async () => {
    const harness = await app({ externalStore: true });
    const requests = harness.exchanges.length;
    const managers = harness.managers.length;
    harness.chosenStore.emit(
      `oidc.user.user:${issuer}:AnotherClient`,
      oidcUser('b', newToken, 'tenant-b').toStorageString(),
    );
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assertOriginal(harness);
    expect(harness.exchanges).toHaveLength(requests);
    expect(harness.managers).toHaveLength(managers);
  });

  it('clears the session if persisting the replacement OIDC user fails after its candidate is verified', async () => {
    const harness = await app({ failCandidateStore: true });
    await expect(switchUser(harness)).rejects.toBeDefined();
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(TokenStorage).getItem('access_token')).toBeNull();
    expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated).toBe(
      false,
    );
  });

  it('keeps the local session cleared when an older external candidate arrives after an explicit clear', async () => {
    const candidate = deferred<Response>();
    const harness = await app({ externalStore: true, candidateConfiguration: candidate });
    const serialized = oidcUser('b', newToken, 'tenant-b').toStorageString();
    harness.chosenStore.storage.setItem(`oidc.user.${userKey}`, serialized);
    const synchronization = harness.injector.get(AbpOAuthService).synchronizeSession();
    await vi.waitFor(() =>
      expect(
        harness.exchanges.some(exchange => exchange.path === '/api/abp/application-configuration'),
      ).toBe(true),
    );
    if (!harness.auth.clearSession)
      throw new TypeError('The local session clear capability is unavailable.');
    await harness.auth.clearSession();
    candidate.resolve(json(configuration('b')));
    await synchronization;
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated).toBe(
      false,
    );
    expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull();
  });

  it('keeps synchronization pending until the newest external candidate has completed', async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    const harness = await app({ externalStore: true, candidateConfigurations: [first, second] });
    harness.chosenStore.storage.setItem(
      `oidc.user.${userKey}`,
      oidcUser('b', newToken, 'tenant-b').toStorageString(),
    );
    const concrete = harness.injector.get(AbpOAuthService);
    const older = concrete.synchronizeSession();
    await vi.waitFor(() =>
      expect(
        harness.exchanges.filter(
          exchange => exchange.path === '/api/abp/application-configuration',
        ),
      ).toHaveLength(1),
    );
    const newer = concrete.synchronizeSession();
    await vi.waitFor(() =>
      expect(
        harness.exchanges.filter(
          exchange => exchange.path === '/api/abp/application-configuration',
        ),
      ).toHaveLength(2),
    );
    first.resolve(json(configuration('b')));
    await older;
    const stillPending = concrete.isSynchronizingSession;
    second.resolve(json(configuration('b')));
    await newer;
    expect(stillPending).toBe(true);
    expect(concrete.isSynchronizingSession).toBe(false);
    expect(harness.auth.getAccessToken()).toBe(newToken);
  });

  it('fully clears the OIDC manager, stored user and renew activity when the verified tenant changes', async () => {
    const harness = await app({ initializeProvider: true });
    const queued = [...harness.oldManager.loaded];
    harness.injector.get(SessionStateService).setTenant(tenantB);
    await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBeNull());
    await vi.waitFor(() =>
      expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull(),
    );
    expect(harness.oldManager.instance.stopSilentRenew).toHaveBeenCalled();
    expect(harness.injector.get(TokenStorage).getItem('refresh_token')).toBeNull();
    await harness.oldManager.instance.storeUser(
      oidcUser('a', 'late-token-after-tenant-drop', 'tenant-a'),
    );
    for (const callback of queued)
      callback(oidcUser('a', 'late-token-after-tenant-drop', 'tenant-a'));
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBeNull();
  });

  it('retains an opaque session for its verified tenant and treats a verified host binding as null', async () => {
    const tenant = await app({ initializeProvider: true });
    tenant.injector.get(SessionStateService).setTenant({ ...tenantA, name: 'Renamed tenant' });
    expect(tenant.auth.getAccessToken()).toBe(oldToken);
    const host = await app({ initializeProvider: true, binding: null });
    expect(host.injector.get(AuthStateService).getTenantId()).toBeNull();
    expect(host.injector.get(TokenStorage).getItem('abpOAuthTenantBinding')).toBe('null');
    host.injector.get(SessionStateService).setTenant({ isAvailable: false });
    expect(host.auth.getAccessToken()).toBe(oldToken);
    host.injector.get(SessionStateService).setTenant(tenantB);
    await vi.waitFor(() => expect(host.auth.getAccessToken()).toBeNull());
  });

  it('keeps an unknown legacy tenant binding distinct from a verified host and clears it on an explicit tenant change', async () => {
    const harness = await app({ initializeProvider: true, binding: undefined });
    const state = harness.injector.get(AuthStateService);
    expect(state.getTenantId()).toBeUndefined();
    expect(Object.hasOwn(state.readStored() ?? {}, 'tenantId')).toBe(false);
    expect(harness.injector.get(TokenStorage).getItem('abpOAuthTenantBinding')).toBeNull();
    harness.injector.get(SessionStateService).setTenant(tenantB);
    await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBeNull());
  });

  it.each(['oidc-first', 'tenant-first'] as const)(
    'adopts another document through the chosen token storage with %s events',
    async order => {
      const harness = await app({ externalStore: true, initializeProvider: true });
      const storage = harness.chosenStore.storage;
      const serialized = oidcUser('b', newToken, 'tenant-b').toStorageString();
      storage.setItem('access_token', newToken);
      storage.setItem('refresh_token', 'refresh-token-b');
      storage.setItem('expires_at', String(Date.now() + 3600_000));
      storage.setItem('abpOAuthTenantBinding', JSON.stringify('tenant-b'));
      storage.setItem(`oidc.user.${userKey}`, serialized);
      if (order === 'tenant-first')
        harness.generalStore.emit('abpSession', JSON.stringify({ tenant: tenantB }));
      harness.chosenStore.emit(`oidc.user.${userKey}`, serialized);
      await vi.waitFor(() => expect(harness.auth.getAccessToken()).toBe(newToken));
      expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
      expect(harness.injector.get(SessionStateService).getTenant()?.id).toBe('tenant-b');
      expect(harness.routes.visible.value.map(route => route.name)).toEqual(['B']);
      expect(
        User.fromStorageString(storage.getItem(`oidc.user.${userKey}`) ?? '{}').profile.sub,
      ).toBe('user-b');
    },
  );

  it('ignores general application storage token events when a separate token storage was selected', async () => {
    const harness = await app({ externalStore: true, initializeProvider: true });
    harness.generalStore.emit(
      `oidc.user.${userKey}`,
      oidcUser('b', newToken, 'tenant-b').toStorageString(),
    );
    harness.generalStore.emit('access_token', newToken);
    await Promise.resolve();
    await Promise.resolve();
    assertOriginal(harness);
    expect(harness.chosenStore.storage.getItem('access_token')).toBe(oldToken);
  });

  it.each([
    'https://outside.example.test/',
    '//outside.example.test/',
    '/\\outside',
    '/\n/outside.example.test',
    '/\t/outside.example.test',
  ])(
    'preserves the original session when the requested return path is unsafe: %s',
    async redirectUrl => {
      const harness = await app();
      const login = harness.auth.loginUsingGrant;
      if (!login) throw new TypeError('The custom grant session transition is unavailable.');
      await expect(
        login('Impersonation', { UserId: 'user-b' }, { tenant: tenantB, redirectUrl }),
      ).rejects.toBeDefined();
      assertOriginal(harness);
      expect(harness.visited).toEqual([]);
    },
  );

  it('stages the new bearer configuration and texts before atomically adopting the target identity and tenant', async () => {
    const candidate = deferred<Response>();
    const harness = await app({ candidateConfiguration: candidate });
    const grant = switchUser(harness);
    void grant.catch(() => undefined);
    await vi.waitFor(() =>
      expect(
        harness.exchanges.some(exchange => exchange.path === '/api/abp/application-configuration'),
      ).toBe(true),
    );
    assertOriginal(harness);
    const request = harness.exchanges.find(
      exchange => exchange.path === '/api/abp/application-configuration',
    );
    expect(request?.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
    expect(request?.headers.get('__tenant')).not.toBe('tenant-a');
    candidate.resolve(json(configuration('b')));
    await grant;
    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(harness.injector.get(TokenStorage).getItem('refresh_token')).toBe('refresh-token-b');
    expect(harness.injector.get(SessionStateService).getTenant()).toEqual(tenantB);
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
    expect(harness.injector.get(PermissionService).isGranted('OnlyB')).toBe(true);
    expect(harness.injector.get(PermissionService).isGranted('OnlyA')).toBe(false);
    expect(harness.routes.visible.value.map(route => route.name)).toEqual(['B']);
    expect(harness.injector.get(LocalizationService).t('Session::Label')).toBe('B');
    const token = harness.exchanges.find(exchange => exchange.path === '/connect/token');
    expect(token?.form?.get('grant_type')).toBe('Impersonation');
    expect(token?.form?.get('access_token')).toBe(oldToken);
    expect(token?.form?.get('UserId')).toBe('user-b');
    expect(token?.headers.has('Authorization')).toBe(false);
    const stored = harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`);
    expect(stored).not.toBeNull();
    const user = User.fromStorageString(stored ?? '{}');
    expect(user.access_token).toBe(newToken);
    expect(user.id_token).not.toBe(oldIdToken);
    expect(user.profile.sub).toBe('user-b');
    expect(user.profile.name).not.toBe('User A');
  });
  it('retains the original identity and OIDC user when the custom grant is refused', async () => {
    const harness = await app({ refused: true });
    const original = harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`);
    await expect(switchUser(harness)).rejects.toBeDefined();
    assertOriginal(harness);
    expect(harness.injector.get(TokenStorage).getItem(`oidc.user.${userKey}`)).toBe(original);
    expect(harness.visited).toEqual([]);
  });
  it.each(['configuration', 'localization'] as const)(
    'retains the original session when candidate %s cannot be read',
    async failure => {
      const harness = await app({
        candidateConfigurationFails: failure === 'configuration',
        candidateLocalizationFails: failure === 'localization',
      });
      await expect(switchUser(harness)).rejects.toBeDefined();
      assertOriginal(harness);
      expect(harness.visited).toEqual([]);
    },
  );
  it('does not resurrect the target session when logout happens while the grant request is pending', async () => {
    const response = deferred<Response>();
    const harness = await app({ grant: response });
    const transition = switchUser(harness).then(
      () => undefined,
      error => error,
    );
    await vi.waitFor(() =>
      expect(harness.exchanges.some(exchange => exchange.path === '/connect/token')).toBe(true),
    );
    await harness.auth.logout({ noRedirectToLogoutUrl: 'true' });
    response.resolve(
      json({ access_token: newToken, refresh_token: 'refresh-token-b', expires_in: 3600 }),
    );
    await transition;
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(TokenStorage).getItem('access_token')).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).not.toBe('user-b');
  });
  it('does not resurrect a target session when the local session is cleared during candidate loading', async () => {
    const candidate = deferred<Response>();
    const harness = await app({ candidateConfiguration: candidate });
    const transition = switchUser(harness).then(
      () => undefined,
      error => error,
    );
    await vi.waitFor(() =>
      expect(
        harness.exchanges.some(exchange => exchange.path === '/api/abp/application-configuration'),
      ).toBe(true),
    );
    if (!harness.auth.clearSession)
      throw new TypeError('A local session clear capability is required.');
    await harness.auth.clearSession();
    candidate.resolve(json(configuration('b')));
    await transition;
    expect(harness.auth.getAccessToken()).toBeNull();
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).not.toBe('user-b');
  });
  it('ignores a retired manager event and prevents its delayed storage write from overwriting the replacement user', async () => {
    const harness = await app();
    const queued = [...harness.oldManager.loaded];
    await switchUser(harness);
    const storage = harness.injector.get(TokenStorage);
    const replacement = storage.getItem(`oidc.user.${userKey}`);
    await harness.oldManager.instance.storeUser(oidcUser('a', 'late-access-token-a'));
    for (const callback of queued) callback(oidcUser('a', 'late-access-token-a'));
    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(storage.getItem('access_token')).toBe(newToken);
    expect(storage.getItem(`oidc.user.${userKey}`)).toBe(replacement);
  });
  it('does not let a retired manager removal or unload event clear the replacement session', async () => {
    const harness = await app();
    const queued = [...harness.oldManager.unloaded];
    await switchUser(harness);
    const storage = harness.injector.get(TokenStorage);
    const replacement = storage.getItem(`oidc.user.${userKey}`);
    await harness.oldManager.instance.removeUser();
    for (const callback of queued) callback();
    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(storage.getItem(`oidc.user.${userKey}`)).toBe(replacement);
  });
  it('keeps the replacement session when an older silent renewal rejects after the identity switch', async () => {
    const harness = await app();
    const renewal = deferred<User | null>();
    harness.oldManager.instance.signinSilent.mockImplementation(() => renewal.promise);
    const pending = harness.auth.refreshToken().then(
      () => undefined,
      error => error,
    );
    await vi.waitFor(() => expect(harness.oldManager.instance.signinSilent).toHaveBeenCalledOnce());
    await switchUser(harness);
    renewal.reject(new TypeError('Old renewal failed'));
    expect(await pending).toBeDefined();
    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(harness.routes.visible.value.map(route => route.name)).toEqual(['B']);
    expect(harness.visited).not.toContain('/account/login');
  });
  it('never replays a mutation started under the original identity after a 401 arrives under the replacement identity', async () => {
    const rejected = deferred<Response>();
    const harness = await app({ mutation: rejected });
    const pending = harness.injector
      .get(RestService)
      .request({
        method: 'PUT',
        url: '/api/identity/organization-units/source',
        body: { displayName: 'Pending edit' },
      })
      .then(
        () => undefined,
        error => error,
      );
    await vi.waitFor(() =>
      expect(harness.exchanges.some(exchange => exchange.path.endsWith('/source'))).toBe(true),
    );
    await switchUser(harness);
    rejected.resolve(json({ error: { message: 'Original identity expired' } }, 401));
    expect(await pending).toBeDefined();
    const mutations = harness.exchanges.filter(exchange => exchange.path.endsWith('/source'));
    expect(mutations).toHaveLength(1);
    expect(mutations[0]?.headers.get('Authorization')).toBe(`Bearer ${oldToken}`);
    expect(harness.auth.getAccessToken()).toBe(newToken);
  });
});

async function passwordApp(
  options: { anonymousConfiguration?: ReturnType<typeof deferred<Response>> | undefined } = {},
) {
  const refresh = deferred<Response>();
  const exchanges: Exchange[] = [];
  const visited: string[] = [];
  const generalStore = externalStorage();
  const send: FetchLike = async (address, init) => {
    const path = new URL(String(address)).pathname;
    const headers = new Headers(init?.headers);
    const form = path === '/connect/token' ? new URLSearchParams(String(init?.body)) : undefined;
    exchanges.push({ path, method: init?.method ?? 'GET', headers, form });
    if (path.endsWith('/.well-known/openid-configuration'))
      return json({ token_endpoint: `${issuer}/connect/token` });
    if (path === '/connect/token')
      return form?.get('grant_type') === 'refresh_token'
        ? refresh.promise
        : json({ access_token: newToken, refresh_token: 'refresh-token-b', expires_in: 3600 });
    if (path === '/api/abp/application-configuration') {
      if (!headers.has('Authorization') && options.anonymousConfiguration)
        return options.anonymousConfiguration.promise;
      return json(
        configuration(
          headers.get('Authorization') === `Bearer ${newToken}`
            ? 'b'
            : headers.get('Authorization') === `Bearer ${oldToken}`
              ? 'a'
              : 'anonymous',
        ),
      );
    }
    if (path === '/api/abp/application-localization')
      return json({
        resources: configuration('b').localization.resources,
        currentCulture: configuration('b').localization.currentCulture,
      });
    return json({});
  };
  const injector = createInjector([
    provideAbpCore(
      withOptions({
        skipGetAppConfiguration: true,
        skipInitAuthService: true,
        environment: {
          apis: { default: { url: issuer } },
          application: { name: 'GrantTests' },
          production: false,
          oAuthConfig: {
            issuer,
            clientId: 'GrantTests',
            responseType: 'token',
            scope: 'openid profile offline_access',
          },
        },
      }),
    ),
    provideAbpOAuth(),
    { provide: TokenStorage, useExisting: MemoryTokenStorage },
    { provide: HTTP_FETCH, useValue: send },
    { provide: StorageService, useValue: generalStore.storage },
    {
      provide: WindowService,
      useValue: {
        nativeWindow: {
          location: {
            href: `${application}/identity/users`,
            assign: (url: string) => visited.push(url),
          },
        } as unknown as Window,
        open: () => {},
      },
    },
  ]);
  injectors.push(injector);
  generalStore.storage.setItem('abpSession', JSON.stringify({ tenant: tenantA }));
  generalStore.storage.setItem('remember_me', 'true');
  injector.get(ConfigStateService).setState(configuration('a'));
  injector.get(AuthStateService).persist({
    accessToken: oldToken,
    refreshToken: 'refresh-token-a',
    expiresAt: Date.now() + 120_000,
    tenantId: 'tenant-a',
  });
  for (const initializer of injector.get(APP_INITIALIZERS))
    await runInInjectionContext(injector, initializer);
  const auth = injector.get(AuthService);
  await auth.init();
  return { injector, auth, refresh, exchanges, visited, generalStore };
}

describe('password grant renewal across identity transitions', () => {
  it('does not let a late anonymous configuration response from logout navigate a newer password login', async () => {
    const anonymous = deferred<Response>();
    const harness = await passwordApp({ anonymousConfiguration: anonymous });
    const ending = harness.auth.logout();
    await vi.waitFor(() =>
      expect(
        harness.exchanges.some(
          exchange =>
            exchange.path.endsWith('/application-configuration') &&
            !exchange.headers.has('Authorization'),
        ),
      ).toBe(true),
    );
    await harness.auth.login({
      username: 'new-user',
      password: 'synthetic-password',
      redirectUrl: '/b',
    });
    expect(harness.auth.getAccessToken()).toBe(newToken);
    anonymous.resolve(json(configuration('anonymous')));
    await ending;

    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
    expect(harness.visited).not.toContain('/');
  });

  it('does not clear a replacement identity when an older scheduled renewal rejects', async () => {
    vi.useFakeTimers();
    const harness = await passwordApp();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(
      harness.exchanges.filter(exchange => exchange.form?.get('grant_type') === 'refresh_token'),
    ).toHaveLength(1);
    const login = harness.auth.loginUsingGrant;
    if (!login) throw new TypeError('The custom grant session transition is unavailable.');
    await login('Impersonation', { UserId: 'user-b', TenantId: 'tenant-b' }, { tenant: tenantB });
    harness.refresh.reject(new TypeError('Retired scheduled renewal failed'));
    await vi.advanceTimersByTimeAsync(0);
    expect(harness.auth.getAccessToken()).toBe(newToken);
    expect(harness.injector.get(ConfigStateService).snapshot().currentUser.id).toBe('user-b');
    expect(harness.injector.get(SessionStateService).getTenant()?.id).toBe('tenant-b');
    expect(harness.visited).not.toContain('/account/login');
  });

  it('cancels a password renewal timer and clears stored tokens when the verified tenant changes', async () => {
    vi.useFakeTimers();
    const harness = await passwordApp();
    harness.injector.get(SessionStateService).setTenant(tenantB);
    expect(harness.auth.getAccessToken()).toBeNull();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(
      harness.exchanges.filter(exchange => exchange.form?.get('grant_type') === 'refresh_token'),
    ).toHaveLength(0);
    expect(harness.injector.get(TokenStorage).keys()).toEqual([]);
    expect(harness.generalStore.storage.getItem('remember_me')).toBeNull();
  });
});
