<template>
  <a v-if="record.email" :href="`mailto:${record.email}`">{{ record.email }}</a>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
defineProps<{ record: IdentityUserDto }>();
</script>
