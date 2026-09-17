<script setup lang="ts">
import { useLocalization, useRoutes } from '@lsw-abpvue/core';
import { MENU } from '../../defaults/texts.js';
import AbpMenuNode from './AbpMenuNode.vue';

/**
 * The sidebar menu. The tree comes from `RoutesService` already filtered by policy,
 * sorted and grouped, so there is nothing to decide here but how it looks.
 */
const routes = useRoutes();
const localization = useLocalization();
</script>

<template>
  <nav class="abp-routes" :aria-label="localization.t(MENU)">
    <template
      v-for="group in routes.groupedVisible.value ?? [{ group: '', items: routes.visible.value }]"
      :key="group.group"
    >
      <h2 v-if="group.group" class="abp-routes__group">{{ localization.t(group.group) }}</h2>

      <ul class="nav flex-column">
        <AbpMenuNode v-for="node in group.items" :key="node.name" :node="node" />
      </ul>
    </template>
  </nav>
</template>

<style scoped>
.abp-routes__group {
  margin: 1rem 0 0.25rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--abp-menu-group-fg);
}
</style>
