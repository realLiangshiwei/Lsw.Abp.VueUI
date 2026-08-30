<script setup lang="ts">
import { useConfigState, useHttpWait } from '@lsw-abpvue/core';
import { computed } from 'vue';
const configState = useConfigState();
const { loading } = useHttpWait();

const currentUser = configState.getOne('currentUser');
const currentTenant = configState.getOne('currentTenant');
const culture = configState.getDeep<string>('localization.currentCulture.displayName');
const cultureName = configState.getDeep<string>('localization.currentCulture.cultureName');
const languages = configState.getDeep<unknown[]>('localization.languages');
const auth = configState.getOne('auth');
const settings = configState.getSettings();

const rows = computed(() => [
  ['currentUser.isAuthenticated', String(currentUser.value.isAuthenticated)],
  ['currentUser.userName', currentUser.value.userName ?? '(anonymous)'],
  ['currentTenant', currentTenant.value.name ?? '(host)'],
  ['localization.currentCulture', `${cultureName.value ?? '?'} — ${culture.value ?? '?'}`],
  ['localization.languages', `${languages.value?.length ?? 0}`],
  ['auth.grantedPolicies', `${Object.keys(auth.value.grantedPolicies).length}`],
  ['setting.values', `${Object.keys(settings.value).length}`],
]);
</script>

<template>
  <section>
    <h2>Application configuration</h2>

    <table>
      <tbody>
        <tr v-for="[name, value] in rows" :key="name">
          <th scope="row">{{ name }}</th>
          <td>{{ value }}</td>
        </tr>
      </tbody>
    </table>

    <p>
      <button type="button" :disabled="loading" @click="configState.refreshAppState()">
        {{ loading ? 'Loading…' : 'Refresh application state' }}
      </button>
    </p>
  </section>
</template>
