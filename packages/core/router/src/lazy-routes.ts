import { inject } from '@lsw-abpvue/core';
import type { RouteRecordRaw } from 'vue-router';
import { ABP_ROUTER } from './tokens.js';

/**
 * A placeholder that swaps itself for a module's real routes the first time anyone
 * navigates into its path — the equivalent of Angular's `loadChildren`.
 *
 * The wildcard is what makes a deep link work on a cold load: `/identity/users` matches
 * the placeholder, the module loads, its routes are added and the same URL is resolved
 * again, this time against the real records.
 * @param path Prefix the module owns, e.g. `/identity`
 * @param load Imports the module and returns its routes
 */
export function lazyRoutes(path: string, load: () => Promise<RouteRecordRaw[]>): RouteRecordRaw {
  const name = `abp-lazy:${path}`;

  return {
    path: `${path}/:abpLazyPath(.*)*`,
    name,
    component: { render: () => null },
    beforeEnter: async to => {
      const router = inject(ABP_ROUTER);
      const routes = await load();

      for (const route of routes) router.addRoute(route);
      router.removeRoute(name);

      return to.fullPath;
    },
  };
}
