<template>
  <AbpPage title="Books">
    <template #toolbar><AbpButton size="sm" @click="created++">New book</AbpButton></template>
    <p>The page owns its content and toolbar.</p>
    <output>New book clicks: {{ created }}</output>
  </AbpPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpPage } from '@lsw-abpvue/components';
import { AbpButton } from '@lsw-abpvue/theme-shared';
const created = ref(0);
</script>
