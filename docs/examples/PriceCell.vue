<template>{{ formatted }}</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocalization } from '@lsw-abpvue/core';

const props = withDefaults(defineProps<{ price: number; currency?: string | undefined }>(), {
  currency: 'USD',
});
const { currentLang } = useLocalization();
const formatted = computed(() =>
  new Intl.NumberFormat(currentLang.value || 'en', {
    style: 'currency',
    currency: props.currency,
  }).format(props.price),
);
</script>
