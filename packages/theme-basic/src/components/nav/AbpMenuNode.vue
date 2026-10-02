<script setup lang="ts">
import { useLocalization, type AbpRoute, type TreeNode } from '@lsw-abpvue/core';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { hasNavigationTarget } from './menu.js';

/**
 * One entry of the sidebar, and everything under it. Recursive because ABP's own menus
 * are three levels deep -- administration, then identity management, then users -- and a
 * middle entry has no path of its own to link to.
 */
const props = defineProps<{ node: TreeNode<AbpRoute> }>();

const localization = useLocalization();
const route = useRoute();
const expanded = ref(false);
const hasChildren = computed(() => props.node.children.some(hasNavigationTarget));

function containsPath(node: TreeNode<AbpRoute>, path: string): boolean {
  return node.path === path || node.children.some(child => containsPath(child, path));
}

watch(
  () => route.path,
  path => {
    if (containsPath(props.node, path)) expanded.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <li v-if="hasNavigationTarget(node)" class="abp-menu-node nav-item">
    <RouterLink v-if="!hasChildren && node.path" class="nav-link" :to="node.path">
      <i v-if="node.iconClass" :class="node.iconClass" aria-hidden="true" />
      <span class="ms-2">{{ localization.t(node.name) }}</span>
    </RouterLink>

    <template v-else>
      <button
        type="button"
        class="nav-link btn btn-link w-100 text-start"
        :aria-expanded="expanded ? 'true' : 'false'"
        @click="expanded = !expanded"
      >
        <i v-if="node.iconClass" :class="node.iconClass" aria-hidden="true" />
        <span class="ms-2">{{ localization.t(node.name) }}</span>
        <i
          class="bi ms-auto"
          :class="expanded ? 'bi-chevron-up' : 'bi-chevron-down'"
          aria-hidden="true"
        />
      </button>

      <ul v-show="expanded" class="nav flex-column ms-3">
        <AbpMenuNode v-for="child in node.children" :key="child.name" :node="child" />
      </ul>
    </template>
  </li>
</template>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2.625rem;
  padding: 0.625rem 0.75rem;
  margin-block: 0.125rem;
  border-radius: var(--abp-control-radius);
  color: var(--abp-sidebar-link-fg);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.nav-link:hover,
.nav-link:focus-visible {
  color: var(--abp-sidebar-link-active-fg);
  background: var(--abp-sidebar-link-active-bg);
}

.router-link-active {
  color: var(--abp-sidebar-link-active-fg);
  background: var(--abp-sidebar-link-active-bg);
  font-weight: 600;
}

.abp-menu-node > ul {
  padding-inline-start: 0.5rem;
  border-inline-start: 1px solid var(--abp-border);
}

.nav-link > .bi:last-child {
  font-size: 0.625rem;
}
</style>
