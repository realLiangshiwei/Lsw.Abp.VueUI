<template>
  <RouterLink to="/" class="navbar-brand d-flex align-items-center gap-2">
    <i class="bi bi-book" aria-hidden="true" />
    <span>{{ application.name }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useEnvironment } from '@lsw-abpvue/core';
const environment = useEnvironment().getEnvironment$();
const application = computed(() => environment.value.application);
</script>
