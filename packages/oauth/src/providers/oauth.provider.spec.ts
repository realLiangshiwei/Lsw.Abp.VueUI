import {
  APP_INITIALIZERS,
  AuthService,
  CHECK_AUTHENTICATION_STATE_FN,
  ConfigStateService,
  createInjector,
  HTTP_FETCH,
  HTTP_INTERCEPTORS,
  MemoryTokenStorage,
  NAVIGATE_TO_MANAGE_PROFILE,
  provideAbpCore,
  runInInjectionContext,
  SessionStateService,
  StorageService,
  TokenStorage,
  withOptions,
  WindowService,
  type ApplicationConfigurationDto,
  type Environment,
  type FetchLike,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { AbpOAuthService } from '../services/abp-oauth.service.js';
import { AuthStateService } from '../services/auth-state.service.js';
import { RememberMeService } from '../services/remember-me.service.js';
import { provideAbpOAuth, withTokenStorage } from './oauth.provider.js';

const ISSUER = 'https://localhost:44384';

const environment: Environment = {
  apis: { default: { url: ISSUER } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: { issuer: `${ISSUER}/`, clientId: 'BookStore_App' },
};

const fixture = configurationFixture as unknown as ApplicationConfigurationDto;

function app(...extra: Parameters<typeof createInjector>[0]) {
  const opened: string[] = [];
  const send: FetchLike = url =>
    Promise.resolve(
      new Response(
        String(url).includes('application-configuration') ? JSON.stringify(fixture) : '{}',
      ),
    );

  return createInjector([
    provideAbpCore(withOptions({ environment })),
    provideAbpOAuth(),
    { provide: TokenStorage, useExisting: MemoryTokenStorage },
    { provide: HTTP_FETCH, useValue: send },
    {
      provide: WindowService,
      useValue: {
        nativeWindow: { location: { href: 'https://app.abp.io/books' } } as unknown as Window,
        open: (url: string) => opened.push(url),
      },
    },
    ...extra,
  ]);
}

describe('provideAbpOAuth', () => {
  it('fills in the AuthService core left open', () => {
    const injector = app();

    expect(injector.get(AuthService)).toBe(injector.get(AbpOAuthService));
  });

  it('the authentication interceptor is last, so a replay still carries the tenant and language headers', () => {
    expect(app().get(HTTP_INTERCEPTORS)).toHaveLength(5);
  });

  it('withTokenStorage moves where tokens are kept', () => {
    const injector = createInjector([
      provideAbpCore(withOptions({ environment })),
      provideAbpOAuth(withTokenStorage(MemoryTokenStorage)),
    ]);

    injector.get(TokenStorage).setItem('access_token', 'abc');

    expect(injector.get(StorageService).getItem('access_token')).toBeNull();
  });
});

describe('checking the authentication state', () => {
  it('holding a token the backend answers as anonymous means the token is spent', () => {
    const injector = app();
    injector.get(AuthStateService).persist({
      accessToken: 'a-token',
      refreshToken: undefined,
      expiresAt: Infinity,
    });

    injector.get(CHECK_AUTHENTICATION_STATE_FN)();

    expect(injector.get(AuthStateService).getAccessToken()).toBeNull();
  });

  it('leaves everything alone when the backend knows the user', () => {
    const injector = app();
    injector.get(ConfigStateService).setState({
      ...fixture,
      currentUser: { ...fixture.currentUser, id: 'user-1', isAuthenticated: true },
    });
    injector.get(AuthStateService).persist({
      accessToken: 'a-token',
      refreshToken: undefined,
      expiresAt: Infinity,
    });

    injector.get(CHECK_AUTHENTICATION_STATE_FN)();

    expect(injector.get(AuthStateService).getAccessToken()).toBe('a-token');
  });

  it('does nothing when nobody was signed in', () => {
    const injector = app();

    expect(() => injector.get(CHECK_AUTHENTICATION_STATE_FN)()).not.toThrow();
  });
});

describe('opening the backend profile page', () => {
  it('carries the way back, so a changed password returns where it started', () => {
    const opened: string[] = [];
    const injector = createInjector([
      provideAbpCore(withOptions({ environment })),
      provideAbpOAuth(),
      {
        provide: WindowService,
        useValue: {
          nativeWindow: { location: { href: 'https://app.abp.io/books' } } as unknown as Window,
          open: (url: string) => opened.push(url),
        },
      },
    ]);

    injector.get(NAVIGATE_TO_MANAGE_PROFILE)();

    expect(opened).toEqual([
      `${ISSUER}/Account/Manage?returnUrl=${encodeURIComponent('https://app.abp.io/books')}`,
    ]);
  });

  it('goes nowhere when no identity server is configured', () => {
    const injector = createInjector([
      provideAbpCore(withOptions({ environment: { ...environment, oAuthConfig: undefined } })),
      provideAbpOAuth(),
    ]);

    expect(() => injector.get(NAVIGATE_TO_MANAGE_PROFILE)()).not.toThrow();
  });
});

/** ABP names the tenant a token was issued for in the `tenantid` claim. */
function tokenFor(tenantId?: string): string {
  const claims = tenantId ? { tenantid: tenantId } : {};
  const payload = btoa(JSON.stringify(claims)).replace(/=+$/, '');

  return `header.${payload}.signature`;
}

describe('switching tenants', () => {
  /** The whole startup, so the listener is registered the way an application registers it. */
  async function session(tenantId?: string) {
    const injector = app();
    for (const initializer of injector.get(APP_INITIALIZERS)) {
      await runInInjectionContext(injector, initializer);
    }

    if (tenantId) injector.get(SessionStateService).setTenant({ id: tenantId, isAvailable: true });
    injector.get(AuthStateService).persist({
      accessToken: tokenFor(tenantId),
      refreshToken: 'r-token',
      expiresAt: Infinity,
    });

    return injector;
  }

  it('a token issued for the previous tenant is dropped when it changes', async () => {
    const injector = await session('id-of-acme');

    injector.get(SessionStateService).setTenant({ id: 'id-of-other', isAvailable: true });

    expect(injector.get(AuthStateService).getAccessToken()).toBeNull();
  });

  it('a tenant token is invalidated by going back to the host', async () => {
    const injector = await session('id-of-acme');

    injector.get(SessionStateService).setTenant(null);

    expect(injector.get(AuthStateService).getAccessToken()).toBeNull();
  });

  it('a host token is invalidated by switching to a tenant', async () => {
    const injector = await session();

    injector.get(SessionStateService).setTenant({ id: 'id-of-acme', isAvailable: true });

    expect(injector.get(AuthStateService).getAccessToken()).toBeNull();
  });

  it('the token stays while the tenant stays the same -- the two writes at startup should not sign anybody out', async () => {
    const injector = await session('id-of-acme');

    injector.get(SessionStateService).setTenant({ id: 'id-of-acme', isAvailable: true });

    expect(injector.get(AuthStateService).getAccessToken()).not.toBeNull();
  });
});

describe('remember me', () => {
  it('remembers what was set and forgets what was removed', () => {
    const service = app().get(RememberMeService);

    expect(service.get()).toBe(false);
    service.set(true);
    expect(service.get()).toBe(true);
    service.remove();
    expect(service.get()).toBe(false);
  });

  it('a claim in the token counts as remembered too', () => {
    const service = app().get(RememberMeService);
    const payload = btoa(JSON.stringify({ remember_me: true })).replace(/=+$/, '');

    expect(service.fromToken(`h.${payload}.s`)).toBe(true);
    expect(service.fromToken(null)).toBe(false);
  });
});
