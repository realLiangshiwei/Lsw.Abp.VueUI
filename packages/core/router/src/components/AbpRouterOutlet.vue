<script setup lang="ts">
import { provideAbp, type ProviderInput } from '@lsw-abpvue/core';
import { inject, provide } from 'vue';
import { useRoute } from 'vue-router';

/**
 * The route-level injector: what Angular's route `providers` do, which vue-router has no
 * equivalent for. A module puts its providers on the record it owns --
 * `meta: { providers: provideIdentity(options) }` -- and everything under that route,
 * including the extension contributors, resolves through them.
 */
const APPLIED = Symbol.for('abp.routeProviders');

const route = useRoute();
// Provider arrays an outlet further up already established, compared by identity: two
// modules nested in one another must not each build the outer module's services.
const applied = inject<readonly ProviderInput[][]>(APPLIED, []);

const mine = route.matched
  .map(record => record.meta.providers)
  .filter((providers): providers is ProviderInput[] => Array.isArray(providers))
  .filter(providers => !applied.includes(providers));

provideAbp(mine.flat());
provide(APPLIED, [...applied, ...mine]);
</script>

<template>
  <RouterView />
</template>
