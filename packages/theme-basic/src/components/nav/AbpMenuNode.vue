<script setup lang="ts">
import { useLocalization, type AbpRoute, type TreeNode } from '@lsw-abpvue/core';
import { ref } from 'vue';

/**
 * One entry of the sidebar, and everything under it. Recursive because ABP's own menus
 * are three levels deep -- administration, then identity management, then users -- and a
 * middle entry has no path of its own to link to.
 */
defineProps<{ node: TreeNode<AbpRoute> }>();

const localization = useLocalization();
const expanded = ref(false);
</script>

<template>
  <li class="nav-item">
    <RouterLink v-if="node.isLeaf && node.path" class="nav-link" :to="node.path">
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
  color: var(--abp-sidebar-link-fg);
}

.nav-link:hover,
.nav-link:focus-visible {
  color: var(--abp-sidebar-link-active-fg);
}

.router-link-active {
  color: var(--abp-sidebar-link-active-fg);
  background: var(--abp-sidebar-link-active-bg);
  border-radius: var(--bs-border-radius);
}
</style>
