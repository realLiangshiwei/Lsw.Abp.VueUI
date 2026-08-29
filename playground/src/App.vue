<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGreeter } from './services/greeting';
import ScopedGreeting from './components/ScopedGreeting.vue';

const apiUrl = import.meta.env.VITE_ABP_API_URL;

const name = ref('ABP');
const greeter = useGreeter();
const greeting = computed(() => greeter.greet(name.value));
</script>

<template>
  <main>
    <h1>Lsw.Abp.VueUI playground</h1>
    <p class="backend">
      Backend: <code>{{ apiUrl }}</code>
    </p>

    <label>
      Name
      <input v-model="name" />
    </label>

    <section>
      <h2>Root injector</h2>
      <output>{{ greeting }}</output>
    </section>

    <ScopedGreeting :name="name" />

    <p class="hint">
      Packages are aliased to their <code>src</code>, so editing one hot-reloads this page.
    </p>
  </main>
</template>

<!-- Not scoped: the demo components below share these styles. -->
<style>
main {
  font-family: system-ui, sans-serif;
  max-width: 42rem;
  margin: 3rem auto;
  padding: 0 1rem;
  line-height: 1.6;
}

label {
  display: block;
  margin-bottom: 0.75rem;
}

input {
  display: block;
  width: 100%;
  padding: 0.4rem 0.5rem;
  font: inherit;
}

output {
  display: block;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  border: 1px solid currentColor;
  border-radius: 4px;
}

button {
  font: inherit;
  padding: 0.35rem 0.75rem;
}

.backend,
.hint {
  opacity: 0.7;
}
</style>
