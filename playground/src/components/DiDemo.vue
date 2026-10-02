<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGreeter } from '../services/greeting';
import ScopedGreeting from './ScopedGreeting.vue';

const name = ref('ABP');
const greeter = useGreeter();
const greeting = computed(() => greeter.greet(name.value));
</script>

<template>
  <section class="card">
    <div class="card-body p-4">
      <h2 class="h5 mb-3">Dependency injection</h2>
      <label class="form-label d-block">
        Name
        <input v-model="name" class="form-control mt-2" />
      </label>
      <output class="d-block text-body-secondary mb-4">{{ greeting }}</output>
      <ScopedGreeting :name="name" />
    </div>
  </section>
</template>
