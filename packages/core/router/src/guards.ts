import {
  AuthService,
  getCurrentInjector,
  inject,
  PermissionService,
  runInInjectionContext,
} from '@lsw-abpvue/core';
import type { NavigationGuard } from 'vue-router';
import { routeInjectorChain } from './route-providers.js';
import { FORBIDDEN_ROUTE } from './tokens.js';

/**
 * Sends anonymous visitors to the login page. Reads `meta.requiresAuthentication`, so a
 * module marks its routes rather than wiring a guard per route.
 *
 * Guards may `inject()` because vue-router runs them in the application's injection
 * context; like anywhere else, that only holds until the first `await`.
 */
export const authGuard: NavigationGuard = async to => {
  if (!to.matched.some(record => record.meta.requiresAuthentication)) return true;

  const auth = inject(AuthService, { optional: true });
  if (!auth || auth.isAuthenticated.value) return true;

  await auth.navigateToLogin(to.fullPath);
  return false;
};

/**
 * Refuses a route whose `meta.requiredPolicy` is not granted. Checks every matched
 * record, so a policy on a parent covers its children.
 */
export const permissionGuard: NavigationGuard = to => {
  const policies = to.matched
    .map(record => record.meta.requiredPolicy)
    .filter((policy): policy is string => Boolean(policy));

  if (policies.length === 0) return true;

  const permission = inject(PermissionService);
  if (policies.every(policy => permission.isGranted(policy))) return true;

  const forbidden = inject(FORBIDDEN_ROUTE);
  // Redirecting to a route that is itself refused would loop, so that one is refused.
  return to.fullPath === forbidden ? false : forbidden;
};

/**
 * Runs work that has to finish before a route is shown -- what Angular does with route
 * resolvers, which vue-router has no equivalent for (difference 7).
 *
 * The resolvers run in the route's own injector, built from the `meta.providers` of the
 * records being entered. That is what lets a module's extension resolver read the
 * contributors the host handed to `provideIdentity(options)`, and `AbpRouterOutlet`
 * hands the same injector to the pages afterwards.
 *
 * @param resolvers Run in parallel, in the injection context of the route
 */
export function withResolvers(
  resolvers: readonly (() => unknown | Promise<unknown>)[],
): NavigationGuard {
  return async to => {
    // Captured before the first await, which is where the context would be gone.
    const root = getCurrentInjector();
    const injector = root ? routeInjectorChain(to.matched, root) : null;

    await Promise.all(
      resolvers.map(resolver =>
        injector ? runInInjectionContext(injector, resolver) : resolver(),
      ),
    );

    return true;
  };
}
