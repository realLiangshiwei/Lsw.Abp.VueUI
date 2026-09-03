<script setup lang="ts">
import { computed } from 'vue';
import { useReplaceableComponents } from '../services/replaceable-components.service.js';

const props = defineProps<{ replaceableKey: string }>();

const replaceable = useReplaceableComponents();
const replacement = computed(() => replaceable.get(props.replaceableKey)?.component);
</script>

<template>
  <!-- Falls back to the slot, so a module ships a default and a host overrides it. -->
  <component :is="replacement" v-if="replacement" v-bind="$attrs" />
  <slot v-else />
</template>
