<script setup lang="ts">
import ApplicationState from '../components/ApplicationState.vue';
import DiDemo from '../components/DiDemo.vue';
</script>

<template>
  <h1 class="h4 mb-3">{{ $t('AbpUi::Welcome') }}</h1>
  <ApplicationState />
  <DiDemo />
</template>
