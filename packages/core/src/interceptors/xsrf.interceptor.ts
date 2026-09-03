import { inject } from '../di/inject.js';
import type { HttpInterceptor } from '../models/http.js';
import { CookieService } from '../services/platform/cookie.service.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

/**
 * Copies the anti-forgery cookie ASP.NET Core sets into the header it expects back.
 * Only on unsafe methods, and never for an absolute URL pointing somewhere else.
 */
export function xsrfInterceptor(): HttpInterceptor {
  const cookies = inject(CookieService);

  return (request, next) => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) return next(request);

    const token = cookies.get('XSRF-TOKEN');
    if (!token) return next(request);

    return next({
      ...request,
      headers: { RequestVerificationToken: token, ...request.headers },
    });
  };
}
