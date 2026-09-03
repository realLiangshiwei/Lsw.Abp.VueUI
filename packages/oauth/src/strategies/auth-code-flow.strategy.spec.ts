import {
  AuthService,
  createInjector,
  HTTP_FETCH,
  MemoryTokenStorage,
  provideAbpCore,
  SessionStateService,
  StorageService,
  TokenStorage,
  WindowService,
  withOptions,
  type Environment,
  type FetchLike,
} from '@lsw-abpvue/core';
import type { User, UserManager } from 'oidc-client-ts';
import { describe, expect, it, vi } from 'vitest';
import { provideAbpOAuth } from '../providers/oauth.provider.js';
import { AbpOAuthService } from '../services/abp-oauth.service.js';
import { AuthStateService } from '../services/auth-state.service.js';
import { buildSettings, USER_MANAGER_FACTORY } from './auth-code-flow.strategy.js';

const ISSUER = 'https://localhost:44384';

const environment: Environment = {
  apis: { default: { url: ISSUER } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: {
    issuer: ISSUER,
    clientId: 'BookStore_App',
    scope: 'offline_access BookStore',
    redirectUri: 'https://app.abp.io',
    responseType: 'code',
  },
};

function user(overrides: Partial<User> = {}): User {
  return {
    access_token: 'a-token',
    refresh_token: 'r-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expired: false,
    state: undefined,
    ...overrides,
  } as User;
}

/** Stands in for `oidc-client-ts`, which owns the protocol but not what we do with it. */
function fakeUserManager(stored: User | null = null) {
  const calls: { name: string; args: unknown[] }[] = [];
  const listeners: { loaded: ((u: User) => void)[]; unloaded: (() => void)[] } = {
    loaded: [],
    unloaded: [],
  };
  const record =
    (name: string, result: unknown = undefined) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return Promise.resolve(result);
    };

  const manager = {
    events: {
      addUserLoaded: (fn: (u: User) => void) => listeners.loaded.push(fn),
      addUserUnloaded: (fn: () => void) => listeners.unloaded.push(fn),
    },
    getUser: record('getUser', stored),
    signinCallback: record('signinCallback', stored),
    signinRedirect: record('signinRedirect'),
    signinSilent: record('signinSilent', stored),
    signoutRedirect: record('signoutRedirect'),
    removeUser: record('removeUser'),
    revokeTokens: record('revokeTokens'),
    clearStaleState: record('clearStaleState'),
  };

  return { calls, listeners, manager: manager as unknown as UserManager };
}

function flow(
  options: {
    href?: string;
    stored?: User | null;
    manager?: ReturnType<typeof fakeUserManager>;
  } = {},
) {
  const fake = options.manager ?? fakeUserManager(options.stored ?? null);
  const replaced: string[] = [];
  const requests: string[] = [];
  const send: FetchLike = url => {
    requests.push(String(url));
    return Promise.resolve(new Response('{}'));
  };

  const injector = createInjector([
    provideAbpCore(withOptions({ environment })),
    provideAbpOAuth(),
    { provide: TokenStorage, useExisting: MemoryTokenStorage },
    { provide: HTTP_FETCH, useValue: send },
    { provide: USER_MANAGER_FACTORY, useValue: () => fake.manager },
    {
      provide: WindowService,
      useValue: {
        nativeWindow: {
          location: { href: options.href ?? 'https://app.abp.io/books' },
          history: { replaceState: (_s: unknown, _t: string, url: string) => replaced.push(url) },
        } as unknown as Window,
        open: () => {},
      },
    },
  ]);

  return { fake, replaced, requests, injector, auth: injector.get(AuthService) };
}

const called = (calls: { name: string; args: unknown[] }[], name: string) =>
  calls.filter(call => call.name === name);

describe('the authorization code flow settings', () => {
  it('turns the ABP oAuthConfig into oidc-client-ts settings', () => {
    const storage = createInjector([]).get(MemoryTokenStorage);

    const settings = buildSettings(environment.oAuthConfig ?? {}, storage);

    expect(settings).toMatchObject({
      authority: ISSUER,
      client_id: 'BookStore_App',
      redirect_uri: 'https://app.abp.io',
      response_type: 'code',
      scope: 'offline_access BookStore',
      automaticSilentRenew: true,
    });
  });

  it('the library sends the token request, so the tenant travels on the settings', () => {
    const storage = createInjector([]).get(MemoryTokenStorage);

    const settings = buildSettings({}, storage, { key: '__tenant', id: 'id-of-acme' });

    expect(settings.extraHeaders).toEqual({ __tenant: 'id-of-acme' });
  });

  it('the state of the library goes into the storage the host chose', async () => {
    const storage = createInjector([]).get(MemoryTokenStorage);

    await buildSettings({}, storage).stateStore?.set('nonce', 'abc');

    expect(storage.getItem('oidc.nonce')).toBe('abc');
  });
});

describe('the authorization code flow', () => {
  it('this flow hands the visitor over and has no login form of its own', () => {
    expect(flow().auth.isInternalAuth).toBe(false);
  });

  it('a login carries the current UI language, so the backend login page uses it too', async () => {
    const { fake, injector, auth } = flow();
    injector.get(SessionStateService).setLanguage('tr');

    await auth.navigateToLogin('/identity/users');

    expect(called(fake.calls, 'signinRedirect')[0]?.args[0]).toEqual({
      state: '/identity/users',
      extraQueryParams: { culture: 'tr', 'ui-culture': 'tr' },
    });
  });

  it('the token arrives after the callback and the address bar goes back to a clean return URL', async () => {
    const { fake, replaced, auth, injector } = flow({
      href: 'https://app.abp.io/?code=abc&state=xyz&ui-culture=tr',
      stored: user({ state: '/identity/users' }),
    });

    await auth.init();

    expect(injector.get(AuthStateService).getAccessToken()).toBe('a-token');
    expect(replaced).toEqual(['/identity/users']);
    expect(called(fake.calls, 'signinCallback')).toHaveLength(1);
  });

  it('a callback it cannot deal with leaves an anonymous visitor -- reloading the callback page should not blank the screen', async () => {
    const fake = fakeUserManager(user());
    fake.manager.signinCallback = () => Promise.reject(new Error('code already redeemed'));
    const { replaced, auth, injector } = flow({
      href: 'https://app.abp.io/books?code=stale&state=xyz&page=2',
      manager: fake,
    });

    await expect(auth.init()).resolves.toBeUndefined();

    expect(injector.get(AuthStateService).isAuthenticated.value).toBe(false);
    expect(replaced).toEqual(['/books?page=2']);
  });

  it('carries on in the culture the backend says its login page used', async () => {
    const { auth, injector } = flow({
      href: 'https://app.abp.io/?code=abc&ui-culture=tr',
      stored: user(),
    });

    await auth.init();

    expect(injector.get(SessionStateService).getLanguage()).toBe('tr');
  });

  it('a callback with no return URL only has its query string cleared', async () => {
    const { replaced, auth } = flow({
      href: 'https://app.abp.io/books?code=abc&state=xyz&page=2',
      stored: user(),
    });

    await auth.init();

    expect(replaced).toEqual(['/books?page=2']);
  });

  it('a session that is still valid is picked up as it is', async () => {
    const { auth, injector, fake } = flow({ stored: user() });

    await auth.init();

    expect(injector.get(AuthStateService).getAccessToken()).toBe('a-token');
    expect(called(fake.calls, 'signinSilent')).toHaveLength(0);
  });

  it('an expired session that asked to be remembered is renewed silently', async () => {
    const fake = fakeUserManager(user({ expired: true }));
    const { auth, injector } = flow({ manager: fake });
    injector.get(StorageService).setItem('remember_me', 'true');

    await auth.init();

    expect(called(fake.calls, 'signinSilent')).toHaveLength(1);
  });

  it('an expired session that did not ask to be remembered is over', async () => {
    const fake = fakeUserManager(user({ expired: true }));

    await flow({ manager: fake }).auth.init();

    expect(called(fake.calls, 'removeUser')).toHaveLength(1);
    expect(called(fake.calls, 'signinSilent')).toHaveLength(0);
  });

  it('a failed renewal leaves an anonymous visitor, not a failed startup', async () => {
    const fake = fakeUserManager(user({ expired: true }));
    fake.manager.signinSilent = vi.fn(() => Promise.reject(new Error('no session')));
    const { auth, injector } = flow({ manager: fake });
    injector.get(StorageService).setItem('remember_me', 'true');

    await expect(auth.init()).resolves.toBeUndefined();

    expect(called(fake.calls, 'removeUser')).toHaveLength(1);
  });

  it('the application picks up the token the library renewed on its own', async () => {
    const { fake, auth, injector } = flow({ stored: user() });
    await auth.init();

    fake.listeners.loaded[0]?.(user({ access_token: 'fresh' }));

    expect(injector.get(AuthStateService).getAccessToken()).toBe('fresh');
  });

  it('the application signs out when the library drops its user', async () => {
    const { fake, auth, injector } = flow({ stored: user() });
    await auth.init();

    fake.listeners.unloaded[0]?.();

    expect(injector.get(AuthStateService).isAuthenticated.value).toBe(false);
  });

  it('logging in is nothing but handing the visitor over', async () => {
    const { fake, auth } = flow();

    await auth.login({ username: '', password: '' });

    expect(called(fake.calls, 'signinRedirect')).toHaveLength(1);
  });

  it('renewal is left to the library', async () => {
    const { fake, injector } = flow({ stored: user() });

    await injector.get(AbpOAuthService).refreshToken();

    expect(called(fake.calls, 'signinSilent')).toHaveLength(1);
  });

  it('clearing the session takes the stale state of the library with it', async () => {
    const { fake, injector } = flow({ stored: user() });
    fake.manager.signinSilent = () => Promise.reject(new Error('no session'));

    await expect(injector.get(AbpOAuthService).refreshToken()).rejects.toBeDefined();

    expect(called(fake.calls, 'removeUser')).toHaveLength(1);
    expect(called(fake.calls, 'clearStaleState')).toHaveLength(1);
  });

  it('a logout goes through the identity server, ending the session there too', async () => {
    const { fake, auth } = flow({ stored: user() });

    await auth.logout();

    expect(called(fake.calls, 'signoutRedirect')).toHaveLength(1);
  });

  it('ends the local session without a trip through the identity server, but reloads the configuration', async () => {
    const { fake, requests, auth } = flow({ stored: user() });

    await auth.logout({ noRedirectToLogoutUrl: 'true' });

    expect(called(fake.calls, 'signoutRedirect')).toHaveLength(0);
    expect(called(fake.calls, 'revokeTokens')).toHaveLength(1);
    expect(called(fake.calls, 'removeUser')).toHaveLength(1);
    // Nothing navigates away here, so without it the menu would keep the signed-in shape.
    expect(requests.filter(url => url.includes('application-configuration'))).toHaveLength(1);
  });
});
