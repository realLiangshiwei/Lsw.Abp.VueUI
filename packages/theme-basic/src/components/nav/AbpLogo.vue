<script setup lang="ts">
import { useEnvironment } from '@lsw-abpvue/core';

const environment = useEnvironment().getEnvironment$();
</script>

<template>
  <RouterLink class="navbar-brand" to="/">
    <img
      v-if="environment.application.logoUrl"
      :src="environment.application.logoUrl"
      :alt="environment.application.name"
      height="28"
    />
    <template v-else>{{ environment.application.name }}</template>
  </RouterLink>
</template>
