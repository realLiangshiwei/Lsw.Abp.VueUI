<template>
  <li class="nav-item">
    <RouterLink to="/help" class="nav-link d-inline-flex align-items-center gap-2">
      <i class="bi bi-question-circle" aria-hidden="true" />
      <span>{{ $t('BookStore::Help') }}</span>
      <span class="badge text-bg-secondary">{{ $t('BookStore::New') }}</span>
    </RouterLink>
  </li>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
