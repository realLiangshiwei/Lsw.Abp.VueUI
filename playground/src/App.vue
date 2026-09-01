<script setup lang="ts">
import { useEnvironment } from '@lsw-abpvue/core';
import { RouterView } from 'vue-router';
import AppMenu from './components/AppMenu.vue';
import LanguagePicker from './components/LanguagePicker.vue';
import SignInPanel from './components/SignInPanel.vue';
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

      <SignInPanel />
      <AppMenu />
      <LanguagePicker />
    </aside>

    <main>
      <p v-if="startupError" class="error">{{ startupError }}</p>
      <RouterView />
    </main>
  </div>
</template>

<!-- Not scoped: the demo components below share these styles. -->
<style>
/* Padding and borders inside the declared width, so a full-width input still fits. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/*
 * Both themes are spelled out. A page that declares no colours at all gets the browser's
 * black text, and a viewer whose browser is in dark mode then reads it on a dark ground.
 */
:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --fg: #1f2328;
  --muted: #656d76;
  --border: #d0d7de;
  --surface: #f6f8fa;
  --link: #0969da;
  --danger: #cf222e;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
    --muted: #9198a1;
    --border: #30363d;
    --surface: #161b22;
    --link: #4493f8;
    --danger: #f85149;
  }
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  background: var(--bg);
  color: var(--fg);
}

a {
  color: var(--link);
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
input[type='password'],
input:not([type]),
select {
  display: block;
  width: 100%;
  padding: 0.4rem 0.5rem;
  font: inherit;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}

output {
  display: block;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
}

button {
  font: inherit;
  padding: 0.35rem 0.75rem;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: var(--muted);
}

button:disabled {
  color: var(--muted);
  cursor: default;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th[scope='row'] {
  text-align: left;
  font-weight: normal;
  color: var(--muted);
  padding: 0.2rem 1rem 0.2rem 0;
  white-space: nowrap;
}

.error {
  padding: 0.75rem;
  border: 1px solid var(--danger);
  border-radius: 4px;
  color: var(--danger);
}

.hint {
  color: var(--muted);
}
</style>
