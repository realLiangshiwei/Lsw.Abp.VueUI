<script setup lang="ts">
import { useReplaceableComponents } from '@lsw-abpvue/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const replaceable = useReplaceableComponents();

/**
 * Renders whatever is registered under the route's replaceable key, falling back to the
 * component the module shipped. This is what lets a host swap a module's page without
 * touching the module's routes.
 */
const component = computed(() => {
  const declared = route.matched.at(-1)?.meta.replaceableComponent;
  if (!declared) return undefined;

  return replaceable.get(declared.key)?.component ?? declared.defaultComponent;
});
</script>

<template>
  <component :is="component" v-if="component" />
</template>
