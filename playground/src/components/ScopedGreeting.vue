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
  <section class="border-top pt-4">
    <h3 class="h6 mb-3">Component-level override</h3>
    <output class="d-block text-body-secondary">{{ greeting }}</output>
    <LeafGreeting :name="name" />

    <button type="button" class="btn btn-outline-secondary mt-3" @click="readFromCallback">
      Resolve from a callback
    </button>
    <output v-if="fromCallback" class="d-block mt-3">{{ fromCallback }}</output>
  </section>
</template>
