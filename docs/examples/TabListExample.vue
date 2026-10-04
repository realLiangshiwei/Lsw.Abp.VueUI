<template>
  <AbpTabList v-model="selected" :items="tabs" orientation="horizontal" aria-label="Book details" />
  <section
    role="tabpanel"
    :aria-label="selected === 'details' ? 'Details' : 'History'"
    class="py-3"
  >
    <p v-if="selected === 'details'">Title: 1984</p>
    <p v-else>No changes recorded.</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpTabList, type AbpTabItem } from '@lsw-abpvue/components';
const selected = ref('details');
const tabs: AbpTabItem[] = [
  { name: 'details', text: { key: 'Demo::Details', defaultValue: 'Details' } },
  { name: 'history', text: { key: 'Demo::History', defaultValue: 'History' } },
];
</script>
