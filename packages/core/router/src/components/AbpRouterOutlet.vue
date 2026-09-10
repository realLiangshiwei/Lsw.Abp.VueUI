<script setup lang="ts">
import { ABP_INJECTOR_KEY, getCurrentInjector, type Injector } from '@lsw-abpvue/core';
import { inject, onScopeDispose, provide } from 'vue';
import { useRoute, type RouteRecordNormalized } from 'vue-router';
import { providingRecords, releaseRouteInjector, routeInjectorFor } from '../route-providers.js';

/**
 * The route-level injector: what Angular's route `providers` do, which vue-router has no
 * equivalent for. A module puts its providers on the record it owns --
 * `meta: { providers: provideIdentity(options) }` -- and everything under that route
 * resolves through them, the resolvers that ran before it included.
 */
const APPLIED = Symbol.for('abp.routeRecords');

const route = useRoute();
// Records an outlet further up already established: two modules nested in one another
// must not each build the outer one's services.
const applied = inject<readonly RouteRecordNormalized[]>(APPLIED, []);
const mine = providingRecords(route.matched).filter(record => !applied.includes(record));

const root = getCurrentInjector();
const built: [RouteRecordNormalized, Injector][] = [];

if (root) {
  let parent = root;
  for (const record of mine) {
    // Built by the resolver guard already, if anything had to resolve before entering.
    parent = routeInjectorFor(record, parent);
    built.push([record, parent]);
  }

  if (built.length > 0) provide(ABP_INJECTOR_KEY, parent);
}

provide(APPLIED, [...applied, ...mine]);

onScopeDispose(() => {
  for (const [record, injector] of built) releaseRouteInjector(record, injector);
});
</script>

<template>
  <RouterView />
</template>
