<script setup lang="ts">
import { computed, ref } from 'vue';
import { provideAbp } from '@lsw-abpvue/core';
import { GreeterService, useGreeter } from '../services/greeting';
import LeafGreeting from './LeafGreeting.vue';

const props = defineProps<{ name: string }>();

// One line replaces the service for this component and everything under it.
const injector = provideAbp([
  {
    provide: GreeterService,
    useFactory: () => ({ greet: (name: string) => `Yo ${name}, from this component.` }),
  },
]);

const greeter = useGreeter();
const greeting = computed(() => greeter.greet(props.name));

// A plain callback has no setup context; the closure holds the injector instead.
const fromCallback = ref('');
const readFromCallback = () => {
  fromCallback.value = injector.get(GreeterService).greet('a click handler');
};
</script>

<template>
  <section>
    <h2>Component-level override</h2>
    <output>{{ greeting }}</output>
    <LeafGreeting :name="name" />

    <button type="button" @click="readFromCallback">Resolve from a callback</button>
    <output v-if="fromCallback">{{ fromCallback }}</output>
  </section>
</template>
