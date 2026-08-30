<script setup lang="ts">
import { useRoutes } from '@lsw-abpvue/core';

// Everything below is driven by RoutesService: the entries came from the routes'
// `meta.routes`, and what is visible is filtered by the granted policies.
const routes = useRoutes();
</script>

<template>
  <nav>
    <template v-for="group in routes.groupedVisible.value" :key="group.group">
      <h3>{{ $t(group.group) }}</h3>
      <ul>
        <li v-for="node in group.items" :key="node.name">
          <RouterLink v-if="node.path" :to="node.path">{{ $t(node.name) }}</RouterLink>
          <span v-else>{{ $t(node.name) }}</span>

          <ul v-if="node.children.length">
            <li v-for="child in node.children" :key="child.name">
              <RouterLink v-if="child.path" :to="child.path">{{ $t(child.name) }}</RouterLink>
            </li>
          </ul>
        </li>
      </ul>
    </template>
  </nav>
</template>

<style>
nav h3 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  margin-bottom: 0.25rem;
}

nav ul {
  list-style: none;
  padding-left: 0;
  margin: 0 0 1rem;
}

nav ul ul {
  padding-left: 1rem;
  margin-bottom: 0;
}
</style>
