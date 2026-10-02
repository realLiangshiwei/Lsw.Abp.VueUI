<script setup lang="ts">
import { useConfigState, useHttpWait } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
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
  <section class="card">
    <div class="card-body p-4">
      <h2 class="h5 mb-3">Application configuration</h2>
      <div class="table-responsive mb-3">
        <table class="table table-sm align-middle">
          <tbody>
            <tr v-for="[name, value] in rows" :key="name">
              <th scope="row" class="small fw-normal py-2">{{ name }}</th>
              <td class="small py-2">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AbpButton
        variant="secondary"
        outline
        :loading="loading"
        @click="configState.refreshAppState()"
      >
        Refresh application state
      </AbpButton>
    </div>
  </section>
</template>
