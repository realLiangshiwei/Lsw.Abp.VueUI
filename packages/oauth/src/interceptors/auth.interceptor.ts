import {
  AbpHttpError,
  AuthErrorFilterService,
  inject,
  type HttpInterceptor,
  type HttpRequestConfig,
} from '@lsw-abpvue/core';
import { AbpOAuthService } from '../services/abp-oauth.service';

function withBearer(request: HttpRequestConfig, token: string): HttpRequestConfig {
  return {
    ...request,
    headers: {
      Authorization: `Bearer ${token}`,
      // Tells ABP this is an API call, so an unauthenticated one is answered with a 401
      // rather than a redirect to the backend's own login page.
      'X-Requested-With': 'XMLHttpRequest',
      ...request.headers,
    },
  };
}

/**
 * Carries the access token, and turns the one failure that is recoverable into a retry:
 * a 401 renews the token and replays the request once. Concurrent 401s share a single
 * renewal, so five requests failing together ask the token endpoint once.
 */
export function authInterceptor(): HttpInterceptor {
  const oauth = inject(AbpOAuthService);
  const filters = inject(AuthErrorFilterService);
  let renewal: Promise<void> | null = null;

  const renewOnce = (): Promise<void> =>
    (renewal ??= oauth.refreshToken().finally(() => {
      renewal = null;
    }));

  return async (request, next) => {
    if (request.context?.skipAuthorization) return next(request);

    const send = () => {
      const token = oauth.getAccessToken();
      return next(token ? withBearer(request, token) : request);
    };

    try {
      return await send();
    } catch (error) {
      const unauthorized = error instanceof AbpHttpError && error.status === 401;
      // A filter claiming the failure says this endpoint answers 401 in the normal
      // course of things -- renewing the token would not change its mind.
      if (!unauthorized || filters.run(error) || !oauth.getRefreshToken()) throw error;

      await renewOnce();
      return send();
    }
  };
}
