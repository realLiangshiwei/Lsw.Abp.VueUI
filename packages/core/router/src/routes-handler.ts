import type { AbpRoute, RoutesService } from '@lsw-abpvue/core';
import type { Router } from 'vue-router';

/**
 * Collects the menu entries routes declare in `meta.routes` and hands them to
 * `RoutesService`. A module therefore describes its menu next to its routes instead of
 * in a second registration step.
 */
export function collectRoutes(router: Router): AbpRoute[] {
  return router.getRoutes().flatMap(record => {
    const declared = record.meta.routes;
    if (!declared) return [];

    const entries = Array.isArray(declared) ? declared : [declared];
    // The record's own path is the default, so a menu entry usually only names itself.
    return entries.map(entry => ({ path: record.path, ...entry }));
  });
}

export function registerRoutes(router: Router, routes: RoutesService): void {
  routes.add(collectRoutes(router));
}
