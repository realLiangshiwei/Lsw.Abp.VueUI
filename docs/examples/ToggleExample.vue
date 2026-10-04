<template>
  <div class="d-flex flex-column gap-3">
    <AbpToggle v-model="enabled" variant="switch" label="Allow borrowing" />
    <AbpToggle v-model="accepted" label="Accept the terms" />
    <AbpToggle v-model="delivery" variant="radio" label="Delivery" :options="options" />
  </div>
  <output>Borrowing: {{ enabled }}; accepted: {{ accepted }}; delivery: {{ delivery }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpToggle, type AbpOption } from '@lsw-abpvue/theme-shared';
const enabled = ref(true);
const accepted = ref(false);
const delivery = ref('pickup');
const options: AbpOption[] = [
  { value: 'pickup', label: 'Pick up' },
  { value: 'post', label: 'Post' },
];
</script>
