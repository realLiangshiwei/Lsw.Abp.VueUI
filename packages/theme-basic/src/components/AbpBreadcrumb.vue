<script setup lang="ts">
import { useLocalization, useRoutes, type AbpRoute, type TreeNode } from '@lsw-abpvue/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { BREADCRUMB } from '../defaults/texts.js';

/**
 * The trail from the menu tree rather than from the URL: ABP's routes carry the names
 * and the grouping, and a path segment does not always have a menu entry of its own.
 */
const routes = useRoutes();
const localization = useLocalization();
const current = useRoute();

const trail = computed(() => {
  const found = routes.search({ path: current.path });
  const nodes: TreeNode<AbpRoute>[] = [];

  for (let node = found; node; node = node.parent ?? null) nodes.unshift(node);

  return nodes;
});
</script>

<template>
  <nav v-if="trail.length > 0" :aria-label="localization.t(BREADCRUMB)">
    <ol class="breadcrumb">
      <li
        v-for="(node, index) in trail"
        :key="node.name"
        class="breadcrumb-item"
        :class="index === trail.length - 1 ? 'active' : null"
        :aria-current="index === trail.length - 1 ? 'page' : undefined"
      >
        <RouterLink v-if="node.path && index < trail.length - 1" :to="node.path">
          {{ localization.t(node.breadcrumbText ?? node.name) }}
        </RouterLink>
        <template v-else>{{ localization.t(node.breadcrumbText ?? node.name) }}</template>
      </li>
    </ol>
  </nav>
</template>
