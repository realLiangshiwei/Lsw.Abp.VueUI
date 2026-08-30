<script setup lang="ts">
import { AuthService, inject, NAVIGATE_TO_MANAGE_PROFILE, useCurrentUser } from '@lsw-abpvue/core';
import { useRoute } from 'vue-router';

/**
 * What M1's "pretend the user is signed in" switch stood in for. The menu and the guards
 * react to this exactly as they did to the fake one, because both end up in
 * `ConfigStateService`.
 */
const auth = inject(AuthService);
const manageProfile = inject(NAVIGATE_TO_MANAGE_PROFILE);
const currentUser = useCurrentUser();
const route = useRoute();
</script>

<template>
  <section v-if="currentUser.isAuthenticated.value" class="sign-in">
    <p class="hint">
      Signed in as <strong>{{ currentUser.user.value.userName }}</strong>
      <template v-if="currentUser.roles.value.length">
        ({{ currentUser.roles.value.join(', ') }})
      </template>
    </p>
    <button type="button" @click="manageProfile()">{{ $t('AbpAccount::MyAccount') }}</button>
    <button type="button" @click="auth.logout()">{{ $t('AbpUi::Logout') }}</button>
  </section>

  <section v-else class="sign-in">
    <RouterLink v-if="auth.isInternalAuth" to="/account/login">
      {{ $t('AbpAccount::Login') }}
    </RouterLink>
    <button v-else type="button" @click="auth.navigateToLogin(route.fullPath)">
      {{ $t('AbpAccount::Login') }}
    </button>
  </section>
</template>

<style>
.sign-in {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.sign-in p {
  flex-basis: 100%;
  margin: 0;
}
</style>
