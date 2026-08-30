import {
  AbpHttpError,
  AuthError,
  defineService,
  EnvironmentService,
  HttpClient,
  inject,
  TwoFactorRequiredError,
  type LoginParams,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { isPlainObject } from '@lsw-abpvue/utils';
import { OAuthEndpointMissingError } from '../models/errors';
import type { DiscoveryDocument, TokenResponse } from '../models/oauth';

/** ABP's own name for "the password was right, now prove the second factor". */
const REQUIRES_TWO_FACTOR = 'RequiresTwoFactor';

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * An OAuth failure is not an ABP error envelope, so `HttpClient` leaves it in `raw`.
 * This is where it becomes something a login form can act on.
 */
function toAuthError(error: unknown): unknown {
  if (!(error instanceof AbpHttpError) || typeof error.raw !== 'string') return error;

  let body: unknown;
  try {
    body = JSON.parse(error.raw);
  } catch {
    return error;
  }

  if (!isPlainObject(body) || typeof body.error !== 'string') return error;
  const { error: code, error_description: description, ...params } = body;

  if (
    description === REQUIRES_TWO_FACTOR &&
    typeof params.userId === 'string' &&
    typeof params.twoFactorToken === 'string'
  ) {
    return new TwoFactorRequiredError(params.userId, params.twoFactorToken, params);
  }

  return new AuthError(code, typeof description === 'string' ? description : undefined, params);
}

/**
 * Talks to the identity server's token endpoint directly. `oidc-client-ts` does have a
 * resource-owner call, but it takes its extra token parameters from the settings object
 * rather than per call -- so ABP's two-factor answer could not be replied to -- and its
 * `ErrorResponse` drops every field of the error body that is not in the RFC, which is
 * exactly where ABP puts `userId` and `twoFactorToken`.
 */
export const TokenEndpointService = defineService('TokenEndpointService', () => {
  const http = inject(HttpClient);
  const environment = inject(EnvironmentService);
  let discovered: { issuer: string; document: Promise<DiscoveryDocument> } | null = null;

  const config = () => environment.getEnvironment().oAuthConfig ?? {};

  /** Cached per issuer: switching tenants can move the identity server. */
  function discover(): Promise<DiscoveryDocument> {
    const issuer = withoutTrailingSlash(config().issuer ?? '');

    if (discovered?.issuer !== issuer) {
      discovered = {
        issuer,
        document: http
          .request<DiscoveryDocument>({
            method: 'GET',
            url: `${issuer}/.well-known/openid-configuration`,
            context: { skipAuthorization: true, skipHandleError: true },
          })
          .then(response => response.body),
      };
    }

    return discovered.document;
  }

  async function endpoint(name: keyof DiscoveryDocument): Promise<string> {
    const url = (await discover())[name];
    if (!url) throw new OAuthEndpointMissingError(name, config().issuer ?? '');

    return url;
  }

  /** Every grant carries the client, and a public client may still have ABP's dummy secret. */
  function client(): Record<string, string | undefined> {
    const { clientId, dummyClientSecret } = config();
    return { client_id: clientId, client_secret: dummyClientSecret };
  }

  async function post<T>(url: string, body: Record<string, string | undefined>): Promise<T> {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== '') form.append(key, value);
    }

    try {
      // Not `skipAddingHeader`: the tenant header is what decides which tenant's user
      // directory the credentials are checked against.
      const response = await http.request<T>({
        method: 'POST',
        url,
        body: form,
        context: { skipAuthorization: true, skipHandleError: true },
      });
      return response.body;
    } catch (error) {
      throw toAuthError(error);
    }
  }

  return {
    /**
     * @param params The credentials, plus ABP's second factor when there is one
     * @throws `TwoFactorRequiredError` when the account has a second factor
     */
    password: async (params: LoginParams): Promise<TokenResponse> => {
      return post<TokenResponse>(await endpoint('token_endpoint'), {
        grant_type: 'password',
        username: params.username,
        password: params.password,
        scope: config().scope,
        ...client(),
        // ABP reads these by their exact names off the token request.
        TwoFactorProvider: params.twoFactorProvider,
        TwoFactorCode: params.twoFactorCode,
        RecoveryCode: params.recoveryCode,
      });
    },

    refresh: async (refreshToken: string): Promise<TokenResponse> => {
      return post<TokenResponse>(await endpoint('token_endpoint'), {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        ...client(),
      });
    },

    /** Revocation is optional in OAuth, so a provider that has no endpoint for it is not an error. */
    revoke: async (token: string, hint: 'access_token' | 'refresh_token'): Promise<void> => {
      const { revocation_endpoint } = await discover();
      if (!revocation_endpoint) return;

      await post(revocation_endpoint, { token, token_type_hint: hint, ...client() });
    },
  };
});
export type TokenEndpointService = ServiceOf<typeof TokenEndpointService>;
