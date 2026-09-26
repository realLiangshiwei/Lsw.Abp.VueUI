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

    return entries.map(entry => ({
      // The record's own path is the default, so a menu entry usually only names itself.
      path: record.path,
      // And its permission: a route the guard turns people away from has no business
      // being in their menu. An entry that wants to differ says so itself, `undefined`
      // included.
      ...(record.meta.requiredPolicy === undefined
        ? {}
        : { requiredPolicy: record.meta.requiredPolicy }),
      ...entry,
    }));
  });
}

export function registerRoutes(router: Router, routes: RoutesService): void {
  routes.add(collectRoutes(router));
}
