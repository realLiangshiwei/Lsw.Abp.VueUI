<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <section>
    <h2>{{ $t(route.meta.title ?? route.path) }}</h2>
    <p class="hint">
      A stand-in until the module packages exist. The route is reachable because its policy is
      granted; the document title came from <code>meta.title</code>.
    </p>
  </section>
</template>
