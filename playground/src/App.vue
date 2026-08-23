<script setup lang="ts">
import { computed, ref } from 'vue';
import { interpolate } from '@lsw-abpvue/utils';

const apiUrl = import.meta.env.VITE_ABP_API_URL;

const template = ref("Welcome to {0}, running against '{1}'.");
const params = ref('Lsw.Abp.VueUI, BookStore');

const result = computed(() =>
  interpolate(
    template.value,
    params.value.split(',').map(p => p.trim()),
  ),
);
</script>

<template>
  <main>
    <h1>Lsw.Abp.VueUI playground</h1>
    <p class="backend">
      Backend: <code>{{ apiUrl }}</code>
    </p>

    <section>
      <h2>@lsw-abpvue/utils &mdash; interpolate</h2>
      <label>
        Template
        <input v-model="template" />
      </label>
      <label>
        Parameters (comma separated)
        <input v-model="params" />
      </label>
      <output>{{ result }}</output>
    </section>

    <p class="hint">
      Packages are aliased to their <code>src</code>, so editing one hot-reloads this page.
    </p>
  </main>
</template>

<style scoped>
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
  padding: 0.75rem;
  border: 1px solid currentColor;
  border-radius: 4px;
}

.backend,
.hint {
  opacity: 0.7;
}
</style>
