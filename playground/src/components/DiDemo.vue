<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGreeter } from '../services/greeting';
import ScopedGreeting from './ScopedGreeting.vue';

const name = ref('ABP');
const greeter = useGreeter();
const greeting = computed(() => greeter.greet(name.value));
</script>

<template>
  <section>
    <h2>Dependency injection</h2>

    <label>
      Name
      <input v-model="name" />
    </label>

    <output>{{ greeting }}</output>
    <ScopedGreeting :name="name" />
  </section>
</template>
