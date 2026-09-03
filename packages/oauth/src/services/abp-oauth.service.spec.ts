import {
  AuthErrorFilterService,
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
import { provideAbpOAuth } from '../providers/oauth.provider.js';
import { AbpOAuthService } from './abp-oauth.service.js';
import { AuthStateService } from './auth-state.service.js';

const ISSUER = 'https://localhost:44384';

const environment: Environment = {
  apis: { default: { url: ISSUER } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: { issuer: ISSUER, clientId: 'BookStore_App' },
};

/** The refresh always fails here: what matters is what the session does about it. */
function app(options: { offline?: boolean } = {}) {
  const visited: string[] = [];
  const requests: string[] = [];

  const send: FetchLike = url => {
    const href = String(url);
    requests.push(href);

    if (options.offline) return Promise.reject(new TypeError('Failed to fetch'));

    if (href.includes('.well-known')) {
      return Promise.resolve(
        new Response(JSON.stringify({ token_endpoint: `${ISSUER}/connect/token` })),
      );
    }
    if (href.includes('/connect/token')) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }),
      );
    }
    if (href.includes('identity/users')) {
      return Promise.resolve(new Response('{}', { status: 401, statusText: 'Unauthorized' }));
    }
    if (href.includes('application-configuration')) {
      return Promise.resolve(new Response(JSON.stringify(configurationFixture)));
    }

    return Promise.resolve(new Response('{}'));
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
          location: { href: 'https://app.abp.io/', assign: (to: string) => visited.push(to) },
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

  return { injector, visited, requests, oauth: injector.get(AbpOAuthService) };
}

describe('after a failed renewal', () => {
  it('the session is treated as over: tokens cleared, off to log in', async () => {
    const { oauth, visited, injector } = app();

    await expect(oauth.refreshToken()).rejects.toBeDefined();

    expect(injector.get(AuthStateService).getAccessToken()).toBeNull();
    expect(visited).toEqual(['/account/login']);
  });

  it('a filter can keep the session when the network is down rather than the identity server refusing', async () => {
    const { oauth, visited, injector } = app({ offline: true });
    injector.get(AuthErrorFilterService).add({
      id: 'keep-session-while-offline',
      executable: true,
      execute: error => error.isTransportFailure,
    });

    await expect(oauth.refreshToken()).rejects.toBeDefined();

    expect(injector.get(AuthStateService).getAccessToken()).toBe('a-token');
    expect(visited).toEqual([]);
  });

  it('a filter claiming an endpoint that answers 401 normally stops the renewal too', async () => {
    const { injector, requests } = app();
    injector.get(AuthErrorFilterService).add({
      id: 'poll',
      executable: true,
      execute: error => error.url.includes('identity/users'),
    });

    await expect(
      injector.get(RestService).request({ method: 'GET', url: '/api/identity/users' }),
    ).rejects.toMatchObject({ status: 401 });

    expect(requests.filter(url => url.includes('/connect/token'))).toEqual([]);
    expect(injector.get(AuthStateService).getAccessToken()).toBe('a-token');
  });
});
