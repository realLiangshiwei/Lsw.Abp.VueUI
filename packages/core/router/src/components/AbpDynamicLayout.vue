<script setup lang="ts">
import {
  inject as injectAbp,
  LayoutType,
  useReplaceableComponents,
  useRoutes,
} from '@lsw-abpvue/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DYNAMIC_LAYOUTS } from '../tokens.js';

const props = defineProps<{ defaultLayout?: LayoutType | undefined }>();

const route = useRoute();
const layouts = injectAbp(DYNAMIC_LAYOUTS);
const replaceable = useReplaceableComponents();
const routes = useRoutes();

/**
 * The nearest layout wins: the matched route records from the deepest outwards, then the
 * menu tree, where a child inherits the section's layout without repeating it.
 */
const layoutType = computed<LayoutType>(() => {
  for (const record of [...route.matched].reverse()) {
    if (record.meta.layout) return record.meta.layout;
  }

  let node = routes.find(item => item.path === route.path);
  while (node) {
    if (node.layout) return node.layout;
    node = node.parent ?? null;
  }

  return props.defaultLayout ?? LayoutType.empty;
});

const layout = computed(() => {
  const key = layouts.get(layoutType.value);
  return key ? replaceable.get(key)?.component : undefined;
});
</script>

<template>
  <!-- Until a theme registers its layouts there is nothing to wrap the page in. -->
  <component :is="layout" v-if="layout">
    <slot />
  </component>
  <slot v-else />
</template>
