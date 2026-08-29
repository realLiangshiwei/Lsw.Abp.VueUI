<script setup lang="ts">
import { computed } from 'vue';
import { useGreeter } from '../services/greeting';

const props = defineProps<{ name: string }>();

// No provider of its own, so this follows whatever the nearest ancestor provided.
const greeter = useGreeter();
const greeting = computed(() => greeter.greet(`${props.name} (child)`));
</script>

<template>
  <output>{{ greeting }}</output>
</template>
