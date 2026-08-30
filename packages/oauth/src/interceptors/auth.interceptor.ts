import {
  AbpHttpError,
  AuthErrorFilterService,
  inject,
  type HttpInterceptor,
  type HttpRequestConfig,
} from '@lsw-abpvue/core';
import { AbpOAuthService } from '../services/abp-oauth.service';

function identified(request: HttpRequestConfig, token: string | null): HttpRequestConfig {
  return {
    ...request,
    headers: {
      // Whether or not there is a token: it tells ABP this is an API call, and an
      // unauthenticated one is then answered with a 401 rather than a redirect to the
      // backend's own login page -- which arrives as a 200 full of HTML.
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

    const send = () => next(identified(request, oauth.getAccessToken()));

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
