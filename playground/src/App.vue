<script setup lang="ts">
import { useEnvironment } from '@lsw-abpvue/core';
import { RouterView } from 'vue-router';
import AppMenu from './components/AppMenu.vue';
import LanguagePicker from './components/LanguagePicker.vue';
import PermissionSwitch from './components/PermissionSwitch.vue';
import { startupError } from './startup';

// Whatever the three levels resolved to, not what this build was compiled with.
const apiUrl = useEnvironment().getApiUrl();
</script>

<template>
  <div class="shell">
    <aside>
      <h1>Lsw.Abp.VueUI</h1>
      <p class="hint">
        Backend: <code>{{ apiUrl }}</code>
      </p>

      <AppMenu />
      <LanguagePicker />
      <PermissionSwitch />
    </aside>

    <main>
      <p v-if="startupError" class="error">{{ startupError }}</p>
      <RouterView />
    </main>
  </div>
</template>

<!-- Not scoped: the demo components below share these styles. -->
<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}

.shell {
  display: grid;
  grid-template-columns: 16rem 1fr;
  gap: 2rem;
  max-width: 64rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

aside h1 {
  font-size: 1.1rem;
}

label {
  display: block;
  margin-bottom: 0.75rem;
}

input[type='text'],
input:not([type]),
select {
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

table {
  width: 100%;
  border-collapse: collapse;
}

th[scope='row'] {
  text-align: left;
  font-weight: normal;
  opacity: 0.7;
  padding: 0.2rem 1rem 0.2rem 0;
  white-space: nowrap;
}

.error {
  padding: 0.75rem;
  border: 1px solid currentColor;
  border-radius: 4px;
}

.hint {
  opacity: 0.7;
}
</style>
