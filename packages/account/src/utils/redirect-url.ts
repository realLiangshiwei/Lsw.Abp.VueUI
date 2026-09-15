import type { Injector } from '@lsw-abpvue/core';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { ACCOUNT_REDIRECT_URL } from '../tokens/config-options.token.js';

/**
 * Where to go once the login succeeded: what sent the visitor here, then what the
 * application configured, then the root.
 * @param injector Resolves the configured fallback
 * @param route The current route, for its `returnUrl`
 */
export function redirectUrlOf(injector: Injector, route: RouteLocationNormalizedLoaded): string {
  const returnUrl = route.query.returnUrl;
  if (typeof returnUrl === 'string' && returnUrl) return returnUrl;

  return injector.get(ACCOUNT_REDIRECT_URL);
}
