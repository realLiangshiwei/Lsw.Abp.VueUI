import {
  AuthService,
  createInjector,
  HTTP_FETCH,
  MemoryTokenStorage,
  provideAbpCore,
  StorageService,
  TokenStorage,
  TwoFactorRequiredError,
  WindowService,
  withOptions,
  type Environment,
  type FetchLike,
} from '@lsw-abpvue/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { provideAbpOAuth } from '../providers/oauth.provider.js';
import { AuthStateService } from '../services/auth-state.service.js';

const ISSUER = 'https://localhost:44384';

const environment: Environment = {
  apis: { default: { url: ISSUER } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: { issuer: ISSUER, clientId: 'BookStore_App', scope: 'BookStore' },
};

const discovery = {
  token_endpoint: `${ISSUER}/connect/token`,
  revocation_endpoint: `${ISSUER}/connect/revocat`,
};

function flow(token: () => Response = () => new Response(null, { status: 400 })) {
  const urls: string[] = [];
  const visited: string[] = [];

  const send: FetchLike = url => {
    const href = String(url);
    urls.push(href);

    if (href.includes('.well-known'))
      return Promise.resolve(new Response(JSON.stringify(discovery)));
    if (href.includes('/connect/')) return Promise.resolve(token());

    return Promise.resolve(new Response(JSON.stringify(configurationFixture)));
  };

  const injector = createInjector([
    provideAbpCore(withOptions({ environment })),
    provideAbpOAuth(),
    { provide: TokenStorage, useExisting: MemoryTokenStorage },
    { provide: HTTP_FETCH, useValue: send },
    {
      provide: WindowService,
      useValue: {
        nativeWindow: {
          location: { href: 'https://app.abp.io/books', assign: (to: string) => visited.push(to) },
        } as unknown as Window,
        open: () => {},
      },
    },
  ]);

  return {
    urls,
    visited,
    injector,
    auth: injector.get(AuthService),
    state: injector.get(AuthStateService),
    storage: injector.get(TokenStorage),
  };
}

const issued = (expiresIn = 3600, refresh: string | null = 'r-token') =>
  new Response(
    JSON.stringify({
      access_token: 'a-token',
      expires_in: expiresIn,
      ...(refresh ? { refresh_token: refresh } : {}),
    }),
  );

describe('the password flow', () => {
  it('a login yields a token and reloads the configuration', async () => {
    const { auth, state, urls } = flow(() => issued());

    await auth.login({ username: 'admin', password: '1q2w3E*' });

    expect(state.getAccessToken()).toBe('a-token');
    expect(auth.isAuthenticated.value).toBe(true);
    expect(urls.some(url => url.includes('application-configuration'))).toBe(true);
  });

  it('goes where the form said after a login', async () => {
    const { auth, visited } = flow(() => issued());

    await auth.login({ username: 'admin', password: '1q2w3E*', redirectUrl: '/books' });

    expect(visited).toEqual(['/books']);
  });

  it('a second factor hands the error to the caller and no token lands', async () => {
    const { auth, state } = flow(
      () =>
        new Response(
          JSON.stringify({
            error: 'invalid_grant',
            error_description: 'RequiresTwoFactor',
            userId: 'user-1',
            twoFactorToken: 'tf',
          }),
          { status: 400 },
        ),
    );

    await expect(auth.login({ username: 'admin', password: '1q2w3E*' })).rejects.toBeInstanceOf(
      TwoFactorRequiredError,
    );
    expect(state.getAccessToken()).toBeNull();
  });

  it('this flow has a login form of its own', () => {
    expect(flow().auth.isInternalAuth).toBe(true);
  });

  it('sends an anonymous visitor to the account login page, remembering the way back', async () => {
    const { auth, visited } = flow();

    await auth.navigateToLogin('/identity/users');

    expect(visited).toEqual(['/account/login?returnUrl=%2Fidentity%2Fusers']);
  });

  it('signs out even when revocation fails -- an offline logout should not keep the user in', async () => {
    const responses: (Response | undefined)[] = [issued()];
    const { auth, state, storage } = flow(
      () => responses.shift() ?? new Response(null, { status: 503 }),
    );
    await auth.login({ username: 'admin', password: '1q2w3E*' });

    await auth.logout();

    expect(state.getAccessToken()).toBeNull();
    expect(storage.keys()).toEqual([]);
  });

  it('a logout revokes the tokens, clears the storage and reloads the configuration', async () => {
    const { auth, urls, state, storage } = flow(() => issued());
    await auth.login({ username: 'admin', password: '1q2w3E*' });

    await auth.logout();

    expect(urls.filter(url => url.includes('/connect/revocat'))).toHaveLength(2);
    expect(state.getAccessToken()).toBeNull();
    expect(storage.keys()).toEqual([]);
  });
});

describe('the password flow at startup', () => {
  it('a stored token that has not expired is used as it is', async () => {
    const { auth, injector, state } = flow(() => issued());
    injector.get(TokenStorage).setItem('access_token', 'a-token');
    injector.get(TokenStorage).setItem('expires_at', String(Date.now() + 3600_000));

    await auth.init();

    expect(state.getAccessToken()).toBe('a-token');
  });

  it('an expired session that did not ask to be remembered is over', async () => {
    const { auth, injector, state } = flow(() => issued());
    injector.get(TokenStorage).setItem('access_token', 'a-token');
    injector.get(TokenStorage).setItem('refresh_token', 'r-token');
    injector.get(TokenStorage).setItem('expires_at', String(Date.now() - 1));

    await auth.init();

    expect(state.getAccessToken()).toBeNull();
  });

  it('a stored session that cannot be renewed leaves an anonymous visitor, not a failed startup', async () => {
    const { auth, injector, state } = flow(
      () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }),
    );
    injector.get(StorageService).setItem('remember_me', 'true');
    injector.get(TokenStorage).setItem('access_token', 'a-token');
    injector.get(TokenStorage).setItem('refresh_token', 'r-token');
    injector.get(TokenStorage).setItem('expires_at', String(Date.now() - 1));

    await expect(auth.init()).resolves.toBeUndefined();

    expect(state.getAccessToken()).toBeNull();
  });

  it('an expired session that asked to be remembered gets a new token', async () => {
    const { auth, injector, state } = flow(
      () => new Response(JSON.stringify({ access_token: 'fresh', expires_in: 3600 })),
    );
    injector.get(StorageService).setItem('remember_me', 'true');
    injector.get(TokenStorage).setItem('access_token', 'a-token');
    injector.get(TokenStorage).setItem('refresh_token', 'r-token');
    injector.get(TokenStorage).setItem('expires_at', String(Date.now() - 1));

    await auth.init();

    expect(state.getAccessToken()).toBe('fresh');
  });
});

describe('renewal in the password flow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renews shortly before expiry, unnoticed', async () => {
    const responses = [
      issued(3600),
      new Response(JSON.stringify({ access_token: 'fresh', expires_in: 3600 })),
    ];
    const { auth, state } = flow(() => responses.shift() ?? issued());

    await auth.login({ username: 'admin', password: '1q2w3E*' });
    await vi.advanceTimersByTimeAsync(3600_000 - 60_000);

    expect(state.getAccessToken()).toBe('fresh');
  });

  it('a renewal the identity server refuses ends the session and sends the user to log in again', async () => {
    const responses: (Response | undefined)[] = [issued(3600)];
    const { auth, state, visited, storage } = flow(
      () =>
        responses.shift() ??
        new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }),
    );
    await auth.login({ username: 'admin', password: '1q2w3E*' });

    await vi.advanceTimersByTimeAsync(3600_000 - 60_000);

    expect(state.getAccessToken()).toBeNull();
    expect(storage.keys()).toEqual([]);
    expect(visited).toEqual(['/account/login']);
  });

  it('without a refresh_token the session is over when the time comes', async () => {
    const { auth, state } = flow(() => issued(3600, null));

    await auth.login({ username: 'admin', password: '1q2w3E*' });
    await vi.advanceTimersByTimeAsync(3600_000);

    expect(state.getAccessToken()).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
  });
});
