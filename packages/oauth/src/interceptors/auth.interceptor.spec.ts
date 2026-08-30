import {
  createInjector,
  HTTP_FETCH,
  MemoryTokenStorage,
  provideAbpCore,
  RestService,
  TokenStorage,
  WindowService,
  withOptions,
  type Environment,
  type FetchLike,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { provideAbpOAuth } from '../providers/oauth.provider';
import { AuthStateService } from '../services/auth-state.service';

const ISSUER = 'https://localhost:44384';

const environment: Environment = {
  apis: { default: { url: ISSUER } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: { issuer: ISSUER, clientId: 'BookStore_App' },
};

interface Exchange {
  url: string;
  headers: Record<string, string>;
}

/**
 * A backend that refuses the first call to a protected endpoint and accepts it once a
 * new token has been issued -- the only shape of failure a UI can recover from on its own.
 */
function api(options: { unauthorizedTimes?: number; refreshFails?: boolean } = {}) {
  const exchanges: Exchange[] = [];
  let unauthorized = options.unauthorizedTimes ?? 0;

  const send: FetchLike = (url, init) => {
    const href = String(url);
    exchanges.push({ url: href, headers: (init?.headers ?? {}) as Record<string, string> });

    if (href.includes('.well-known')) {
      return Promise.resolve(
        new Response(JSON.stringify({ token_endpoint: `${ISSUER}/connect/token` })),
      );
    }
    if (href.includes('/connect/token')) {
      return Promise.resolve(
        options.refreshFails
          ? new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })
          : new Response(JSON.stringify({ access_token: 'fresh-token', expires_in: 3600 })),
      );
    }
    if (href.includes('application-configuration')) {
      return Promise.resolve(new Response(JSON.stringify(configurationFixture)));
    }
    if (unauthorized > 0) {
      unauthorized -= 1;
      return Promise.resolve(new Response('{}', { status: 401, statusText: 'Unauthorized' }));
    }

    return Promise.resolve(new Response(JSON.stringify({ items: [] })));
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
          location: { href: 'https://app.abp.io/', assign: () => {} },
        } as unknown as Window,
        open: () => {},
      },
    },
  ]);

  injector.get(AuthStateService).persist({
    accessToken: 'a-token',
    refreshToken: 'r-token',
    expiresAt: Date.now() + 3600_000,
  });

  const protectedCall = () =>
    injector.get(RestService).request({ method: 'GET', url: '/api/identity/users' });

  return { exchanges, injector, protectedCall };
}

const users = (exchanges: Exchange[]) => exchanges.filter(e => e.url.includes('identity/users'));
const tokens = (exchanges: Exchange[]) => exchanges.filter(e => e.url.includes('/connect/token'));

describe('the authentication interceptor', () => {
  it('carries the access token and tells ABP this is an API call', async () => {
    const { exchanges, protectedCall } = api();

    await protectedCall();

    expect(users(exchanges)[0]?.headers).toMatchObject({
      Authorization: 'Bearer a-token',
      'X-Requested-With': 'XMLHttpRequest',
    });
  });

  it('does not force an empty Authorization when there is no token, but still says this is an API call', async () => {
    const { exchanges, injector, protectedCall } = api();
    injector.get(AuthStateService).persist(null);

    await protectedCall();

    expect(users(exchanges)[0]?.headers.Authorization).toBeUndefined();
    // Without it ABP redirects an anonymous API call to its login page, and the answer
    // is a 200 full of HTML instead of the 401 the caller can act on.
    expect(users(exchanges)[0]?.headers['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('the token endpoint carries no bearer of its own, or a failed login would set off a renewal', async () => {
    const { exchanges, injector } = api();

    await injector.get(AuthStateService).getAccessToken();
    await injector
      .get(RestService)
      .request(
        { method: 'GET', url: `${ISSUER}/.well-known/openid-configuration` },
        { skipAuthorization: true },
      );

    expect(exchanges.at(-1)?.headers.Authorization).toBeUndefined();
  });

  it('renews and replays once after a 401, so the caller never sees it', async () => {
    const { exchanges, protectedCall } = api({ unauthorizedTimes: 1 });

    await expect(protectedCall()).resolves.toEqual({ items: [] });

    expect(users(exchanges)).toHaveLength(2);
    expect(users(exchanges)[1]?.headers.Authorization).toBe('Bearer fresh-token');
  });

  it('five requests failing together renew once', async () => {
    const { exchanges, protectedCall } = api({ unauthorizedTimes: 5 });

    await Promise.all([1, 2, 3, 4, 5].map(protectedCall));

    expect(users(exchanges)).toHaveLength(10);
    expect(tokens(exchanges)).toHaveLength(1);
  });

  it('a 401 after the replay is handed to the caller rather than retried forever', async () => {
    const { exchanges, protectedCall } = api({ unauthorizedTimes: 2 });

    await expect(protectedCall()).rejects.toMatchObject({ status: 401 });

    expect(users(exchanges)).toHaveLength(2);
  });

  it('a failed renewal clears the session and sends the user to log in', async () => {
    const { exchanges, injector, protectedCall } = api({
      unauthorizedTimes: 1,
      refreshFails: true,
    });

    await expect(protectedCall()).rejects.toBeDefined();

    expect(injector.get(AuthStateService).getAccessToken()).toBeNull();
    expect(exchanges.some(e => e.url.includes('application-configuration'))).toBe(true);
  });
});
