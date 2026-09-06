<script setup lang="ts">
import { useLocalization, useRoutes, type AbpRoute, type TreeNode } from '@lsw-abpvue/core';
import { ref } from 'vue';
import { MENU } from '../../defaults/texts.js';

/**
 * The sidebar menu. The tree comes from `RoutesService` already filtered by policy,
 * sorted and grouped, so there is nothing to decide here but how it looks.
 */
const routes = useRoutes();
const localization = useLocalization();

const expanded = ref(new Set<string>());

function toggle(name: string): void {
  const next = new Set(expanded.value);
  if (!next.delete(name)) next.add(name);
  expanded.value = next;
}

const label = (node: TreeNode<AbpRoute>): string => localization.t(node.name);
</script>

<template>
  <nav class="abp-routes" :aria-label="localization.t(MENU)">
    <template
      v-for="group in routes.groupedVisible.value ?? [{ group: '', items: routes.visible.value }]"
      :key="group.group"
    >
      <h2 v-if="group.group" class="abp-routes__group">{{ localization.t(group.group) }}</h2>

      <ul class="nav flex-column">
        <li v-for="node in group.items" :key="node.name" class="nav-item">
          <RouterLink v-if="node.isLeaf && node.path" class="nav-link" :to="node.path">
            <i v-if="node.iconClass" :class="node.iconClass" aria-hidden="true" />
            <span class="ms-2">{{ label(node) }}</span>
          </RouterLink>

          <template v-else>
            <button
              type="button"
              class="nav-link btn btn-link w-100 text-start"
              :aria-expanded="expanded.has(node.name) ? 'true' : 'false'"
              @click="toggle(node.name)"
            >
              <i v-if="node.iconClass" :class="node.iconClass" aria-hidden="true" />
              <span class="ms-2">{{ label(node) }}</span>
              <i
                class="bi ms-auto"
                :class="expanded.has(node.name) ? 'bi-chevron-up' : 'bi-chevron-down'"
                aria-hidden="true"
              />
            </button>

            <ul v-show="expanded.has(node.name)" class="nav flex-column ms-3">
              <li v-for="child in node.children" :key="child.name" class="nav-item">
                <RouterLink v-if="child.path" class="nav-link" :to="child.path">
                  <i v-if="child.iconClass" :class="child.iconClass" aria-hidden="true" />
                  <span class="ms-2">{{ label(child) }}</span>
                </RouterLink>
              </li>
            </ul>
          </template>
        </li>
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

.nav-link {
  display: flex;
  align-items: center;
}
</style>
