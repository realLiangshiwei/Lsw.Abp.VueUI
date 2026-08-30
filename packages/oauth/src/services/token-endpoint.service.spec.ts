import {
  AuthError,
  createInjector,
  HTTP_FETCH,
  provideAbpCore,
  TwoFactorRequiredError,
  withOptions,
  type Environment,
  type FetchLike,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { OAuthEndpointMissingError } from '../models/errors';
import { TokenEndpointService } from './token-endpoint.service';

const ISSUER = 'https://localhost:44384';

const environment: Environment = {
  apis: { default: { url: ISSUER } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: {
    issuer: `${ISSUER}/`,
    clientId: 'BookStore_App',
    scope: 'offline_access BookStore',
  },
};

const discovery = {
  token_endpoint: `${ISSUER}/connect/token`,
  revocation_endpoint: `${ISSUER}/connect/revocat`,
  end_session_endpoint: `${ISSUER}/connect/logout`,
};

interface Exchange {
  url: string;
  body: Record<string, string>;
}

/**
 * The seam is `HTTP_FETCH`, as everywhere else: the refusals a token endpoint produces --
 * a wrong password, a second factor, a body that is not an ABP envelope -- go through the
 * real transport rather than around it.
 */
function endpoint(answer: (url: string) => Response = () => new Response(null, { status: 400 })) {
  const exchanges: Exchange[] = [];

  const send: FetchLike = (url, init) => {
    const body = init?.body instanceof URLSearchParams ? Object.fromEntries(init.body) : {};
    exchanges.push({ url: String(url), body });

    if (String(url).includes('.well-known')) {
      return Promise.resolve(new Response(JSON.stringify(discovery)));
    }

    return Promise.resolve(answer(String(url)));
  };

  const injector = createInjector([
    provideAbpCore(withOptions({ environment })),
    { provide: HTTP_FETCH, useValue: send },
  ]);

  return { exchanges, service: injector.get(TokenEndpointService) };
}

const ok = () =>
  new Response(
    JSON.stringify({ access_token: 'a-token', refresh_token: 'r-token', expires_in: 3600 }),
  );

describe('the token endpoint', () => {
  it('the endpoint URL comes from the metadata rather than a guessed path', async () => {
    const { exchanges, service } = endpoint(ok);

    await service.password({ username: 'admin', password: '1q2w3E*' });

    expect(exchanges[0]?.url).toBe(`${ISSUER}/.well-known/openid-configuration`);
    expect(exchanges[1]?.url).toBe(`${ISSUER}/connect/token`);
  });

  it('the metadata is fetched once', async () => {
    const { exchanges, service } = endpoint(ok);

    await service.password({ username: 'admin', password: '1q2w3E*' });
    await service.refresh('r-token');

    expect(exchanges.filter(exchange => exchange.url.includes('.well-known'))).toHaveLength(1);
  });

  it('the password grant carries the client and the scope', async () => {
    const { exchanges, service } = endpoint(ok);

    await service.password({ username: 'admin', password: '1q2w3E*' });

    expect(exchanges[1]?.body).toEqual({
      grant_type: 'password',
      username: 'admin',
      password: '1q2w3E*',
      scope: 'offline_access BookStore',
      client_id: 'BookStore_App',
    });
  });

  it('sends the two-factor parameters under the names ABP reads', async () => {
    const { exchanges, service } = endpoint(ok);

    await service.password({
      username: 'admin',
      password: '1q2w3E*',
      twoFactorProvider: 'Authenticator',
      twoFactorCode: '123456',
    });

    expect(exchanges[1]?.body).toMatchObject({
      TwoFactorProvider: 'Authenticator',
      TwoFactorCode: '123456',
    });
  });

  it('a second factor throws an error carrying userId and twoFactorToken', async () => {
    const { service } = endpoint(
      () =>
        new Response(
          JSON.stringify({
            error: 'invalid_grant',
            error_description: 'RequiresTwoFactor',
            userId: 'user-1',
            twoFactorToken: 'tf-token',
          }),
          { status: 400 },
        ),
    );

    const failure = await service
      .password({ username: 'admin', password: '1q2w3E*' })
      .catch(e => e);

    expect(failure).toBeInstanceOf(TwoFactorRequiredError);
    expect(failure).toMatchObject({ userId: 'user-1', twoFactorToken: 'tf-token' });
  });

  it('a wrong password gives an OAuth error code the login form can put into words', async () => {
    const { service } = endpoint(
      () =>
        new Response(
          JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid username or password!',
          }),
          { status: 400 },
        ),
    );

    const failure = await service.password({ username: 'admin', password: 'wrong' }).catch(e => e);

    expect(failure).toBeInstanceOf(AuthError);
    expect(failure).toMatchObject({
      error: 'invalid_grant',
      errorDescription: 'Invalid username or password!',
    });
  });

  it('a failure that is not an OAuth error body is rethrown, not dressed up as one', async () => {
    const { service } = endpoint(
      () => new Response('<html>gateway timeout</html>', { status: 504 }),
    );

    const failure = await service.password({ username: 'admin', password: 'x' }).catch(e => e);

    expect(failure).not.toBeInstanceOf(AuthError);
    expect(failure).toMatchObject({ status: 504 });
  });

  it('a renewal uses the refresh_token grant', async () => {
    const { exchanges, service } = endpoint(ok);

    await service.refresh('r-token');

    expect(exchanges[1]?.body).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'r-token',
      client_id: 'BookStore_App',
    });
  });

  it('a logout revokes the tokens', async () => {
    const { exchanges, service } = endpoint(() => new Response(null, { status: 200 }));

    await service.revoke('r-token', 'refresh_token');

    expect(exchanges[1]).toMatchObject({
      url: `${ISSUER}/connect/revocat`,
      body: { token: 'r-token', token_type_hint: 'refresh_token', client_id: 'BookStore_App' },
    });
  });

  it('sends nothing when the identity server has no revocation endpoint', async () => {
    const { exchanges, service } = endpoint(ok);
    // A document without the endpoint: revocation is optional in OAuth.
    delete (discovery as Partial<typeof discovery>).revocation_endpoint;

    await service.revoke('r-token', 'refresh_token');
    discovery.revocation_endpoint = `${ISSUER}/connect/revocat`;

    expect(exchanges).toHaveLength(1);
  });

  it('an error names what to check when the metadata has no token endpoint', async () => {
    const { service } = endpoint(ok);
    const token = discovery.token_endpoint;
    delete (discovery as Partial<typeof discovery>).token_endpoint;

    const failure = await service.password({ username: 'a', password: 'b' }).catch(e => e);
    discovery.token_endpoint = token;

    expect(failure).toBeInstanceOf(OAuthEndpointMissingError);
    expect(String(failure)).toContain('openid-configuration');
  });
});
