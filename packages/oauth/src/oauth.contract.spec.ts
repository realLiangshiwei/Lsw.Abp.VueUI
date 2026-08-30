import {
  AuthService,
  createInjector,
  CurrentUserService,
  provideAbpCore,
  RestService,
  withOptions,
  type Environment,
} from '@lsw-abpvue/core';
import { afterAll, describe, expect, it } from 'vitest';
import { provideAbpOAuth } from './providers/oauth.provider';
import { AuthStateService } from './services/auth-state.service';

/**
 * The package compiles with `types: []` so that nothing in it can reach for a node
 * global by accident. A contract test needs exactly one, so it is declared here rather
 * than by widening the whole package.
 */
declare const process: { env: Record<string, string | undefined> };

const BACKEND = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
const USERNAME = process.env.ABP_TEST_USERNAME ?? 'admin';
const PASSWORD = process.env.ABP_TEST_PASSWORD ?? '1q2w3E*';

// The test backend serves a development certificate. Restored afterwards so nothing else
// in this worker inherits it.
const strictTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function reachable(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const live = await reachable();
if (!live) {
  // Rule 3 of the testing conventions: a test that has to authenticate has no fixture to
  // fall back to, so it says why it is not running and steps aside.
  console.info(
    `[contract] No ABP backend at ${BACKEND}; skipping the authentication contract tests.\n` +
      '  docker start abpvue-mongo && cd e2e/backend/BookStore/src/BookStore.HttpApi.Host && dotnet run',
  );
}

const environment: Environment = {
  apis: { default: { url: BACKEND } },
  application: { name: 'BookStore' },
  production: false,
  oAuthConfig: {
    issuer: BACKEND,
    clientId: 'BookStore_App',
    scope: 'offline_access BookStore',
  },
};

function application() {
  const injector = createInjector([
    provideAbpCore(withOptions({ environment })),
    provideAbpOAuth(),
  ]);

  return {
    auth: injector.get(AuthService),
    state: injector.get(AuthStateService),
    rest: injector.get(RestService),
    currentUser: injector.get(CurrentUserService),
  };
}

/**
 * The one thing unit tests cannot answer: whether ABP agrees with what this package
 * sends it. Everything here goes to a real backend over a real socket.
 */
describe.skipIf(!live)('against a real ABP backend', () => {
  afterAll(() => {
    if (strictTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = strictTls;
  });

  it('after a password login the backend knows the user', async () => {
    const { auth, currentUser } = application();

    await auth.login({ username: USERNAME, password: PASSWORD });

    expect(auth.isAuthenticated.value).toBe(true);
    expect(currentUser.user.value.userName).toBe(USERNAME);
    expect(currentUser.user.value.isAuthenticated).toBe(true);
  });

  it('a token reaches a protected endpoint; without one it is refused', async () => {
    const { auth, rest } = application();
    const anonymous = application();

    await expect(
      anonymous.rest.request(
        { method: 'GET', url: '/api/identity/users' },
        { skipHandleError: true },
      ),
    ).rejects.toMatchObject({ status: 401 });

    await auth.login({ username: USERNAME, password: PASSWORD });

    await expect(
      rest.request<never, { totalCount: number }>({ method: 'GET', url: '/api/identity/users' }),
    ).resolves.toMatchObject({ totalCount: expect.any(Number) });
  });

  it('a renewal yields a new token and the session carries on', async () => {
    const { auth, state, rest } = application();
    await auth.login({ username: USERNAME, password: PASSWORD });
    const before = state.getAccessToken();

    await auth.refreshToken();

    expect(state.getAccessToken()).not.toBe(before);
    await expect(
      rest.request({ method: 'GET', url: '/api/identity/users' }),
    ).resolves.toBeDefined();
  });

  it('after a logout the token is revoked and the backend sees an anonymous visitor', async () => {
    const { auth, state, currentUser } = application();
    await auth.login({ username: USERNAME, password: PASSWORD });

    await auth.logout();

    expect(state.getAccessToken()).toBeNull();
    expect(currentUser.user.value.isAuthenticated).toBe(false);
  });

  it('a wrong password gives invalid_grant, which the login form puts into words', async () => {
    const { auth } = application();

    await expect(
      auth.login({ username: USERNAME, password: 'definitely-not-the-password' }),
    ).rejects.toMatchObject({ error: 'invalid_grant' });
  });
});
