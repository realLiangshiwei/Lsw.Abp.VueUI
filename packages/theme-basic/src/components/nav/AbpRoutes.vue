<script setup lang="ts">
import { useEnvironment, useLocalization, useRoutes } from '@lsw-abpvue/core';
import { computed } from 'vue';
import AbpMenuNode from './AbpMenuNode.vue';
import { hasNavigationTarget } from './menu.js';

/**
 * The sidebar menu, without groups left empty by permission filtering.
 */
const routes = useRoutes();
const environment = useEnvironment().getEnvironment$();
const localization = useLocalization();
const groups = computed(() =>
  (routes.groupedVisible.value ?? [{ group: '', items: routes.visible.value }])
    .map(group => ({ ...group, items: group.items.filter(hasNavigationTarget) }))
    .filter(group => group.items.length > 0),
);
</script>

<template>
  <nav class="abp-routes" :aria-label="environment.application.name">
    <template v-for="group in groups" :key="group.group">
      <h2 v-if="group.group" class="abp-routes__group">{{ localization.t(group.group) }}</h2>

      <ul class="nav flex-column">
        <AbpMenuNode v-for="node in group.items" :key="node.name" :node="node" />
      </ul>
    </template>
  </nav>
</template>

<style scoped>
.abp-routes__group {
  margin: 1.75rem 0.75rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--abp-menu-group-fg);
}
</style>
