<template>
  <div class="d-flex gap-3 align-items-center" :aria-busy="loading">
    <AbpButton variant="secondary" @click="loading = !loading">Toggle loading</AbpButton>
    <AbpSpinner v-if="loading" size="sm" label="Loading books" />
    <span>{{ loading ? 'Loading…' : 'Ready' }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpButton, AbpSpinner } from '@lsw-abpvue/theme-shared';
const loading = ref(true);
</script>
