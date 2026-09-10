import { createInjector, type Injector } from '@lsw-abpvue/core';
import type { RouteRecordNormalized } from 'vue-router';

/**
 * The injector of each route record that brings providers. One per record, so the
 * resolvers that run before a route is shown and the components that render inside it
 * resolve the same instances -- which is what Angular's route-level `providers` mean.
 *
 * Keyed by the record, which the router creates once, and weakly, so a route that goes
 * away takes its entry with it.
 */
const injectors = new WeakMap<RouteRecordNormalized, Injector>();

/** The matched records that bring providers, outermost first. */
export function providingRecords(
  matched: readonly RouteRecordNormalized[],
): RouteRecordNormalized[] {
  return matched.filter(record => Array.isArray(record.meta.providers));
}

/**
 * The injector of one record, built on first use and handed back afterwards.
 * @param record The matched route record
 * @param parent What it resolves through
 */
export function routeInjectorFor(record: RouteRecordNormalized, parent: Injector): Injector {
  const existing = injectors.get(record);
  if (existing) return existing;

  const created = createInjector(record.meta.providers ?? [], parent);
  injectors.set(record, created);

  return created;
}

/**
 * The innermost injector of a location: every providing record nests inside the one
 * above it.
 * @param matched The matched records of the location being entered
 * @param root What the outermost one resolves through
 */
export function routeInjectorChain(
  matched: readonly RouteRecordNormalized[],
  root: Injector,
): Injector {
  let parent = root;
  for (const record of providingRecords(matched)) parent = routeInjectorFor(record, parent);

  return parent;
}

/**
 * Destroys a record's injector when the outlet that used it goes away. A newer
 * navigation may already have built another one; that one is left alone.
 * @param record The record the injector belongs to
 * @param injector The injector to release
 */
export function releaseRouteInjector(record: RouteRecordNormalized, injector: Injector): void {
  if (injectors.get(record) !== injector) return;

  injectors.delete(record);
  injector.destroy();
}
