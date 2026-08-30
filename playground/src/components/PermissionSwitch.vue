<script setup lang="ts">
import { useConfigState } from '@lsw-abpvue/core';
import { computed } from 'vue';

/**
 * Until the authentication package lands there is no way to log in here, so this grants
 * the policies by hand — the same state a login would produce. The menu and the guards
 * react to it exactly as they would after a real sign-in.
 */
const POLICIES = ['AbpIdentity.Users', 'AbpTenantManagement.Tenants'];

const configState = useConfigState();
const auth = configState.getOne('auth');
const granted = computed(() => POLICIES.every(policy => auth.value.grantedPolicies[policy]));

function toggle(event: Event) {
  const on = (event.target as HTMLInputElement).checked;

  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries(POLICIES.map(policy => [policy, on])) },
  });
}
</script>

<template>
  <label class="hint">
    <input type="checkbox" :checked="granted" @change="toggle" />
    Pretend the user is signed in with the admin permissions
  </label>
</template>
