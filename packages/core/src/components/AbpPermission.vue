<script setup lang="ts">
import { usePermission } from '../services/permission.service.js';

const props = defineProps<{ policy?: string | undefined }>();

// A component rather than Angular's structural directive: a Vue directive can style an
// element but cannot keep it out of the tree (api-parity-map Δ5).
const granted = usePermission().isGrantedRef(() => props.policy);
</script>

<template>
  <slot v-if="granted" />
</template>
