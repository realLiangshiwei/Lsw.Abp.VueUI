<script setup lang="ts">
import { AccountComponents } from '@lsw-abpvue/account-core';
import { useReplaceableComponents } from '@lsw-abpvue/core';
import { computed } from 'vue';
import AbpConfirmHost from '../components/AbpConfirmHost.vue';
import AbpErrorPage from '../components/AbpErrorPage.vue';
import AbpLoaderBar from '../components/AbpLoaderBar.vue';
import AbpPageAlerts from '../components/AbpPageAlerts.vue';
import AbpToastHost from '../components/AbpToastHost.vue';
import AbpAuthWrapper from '../components/account/AbpAuthWrapper.vue';
import AbpLogo from '../components/nav/AbpLogo.vue';
import AbpLanguages from '../components/nav/AbpLanguages.vue';

const replaceable = useReplaceableComponents();

const authWrapper = computed(
  () => replaceable.getRef(AccountComponents.AuthWrapper).value ?? AbpAuthWrapper,
);
</script>

<template>
  <AbpLoaderBar />

  <div class="abp-account d-flex flex-column align-items-center justify-content-center">
    <header class="abp-account__header d-flex align-items-center justify-content-between">
      <AbpLogo />
      <ul class="navbar-nav">
        <AbpLanguages />
      </ul>
    </header>

    <main class="abp-account__main">
      <AbpPageAlerts />
      <!-- The card, the tenant box and the "no login schemes" notice all live in the
           wrapper, because a page has to be able to be replaced without losing them. -->
      <component :is="authWrapper">
        <slot />
      </component>
    </main>
  </div>

  <AbpToastHost />
  <AbpConfirmHost />
  <AbpErrorPage />
</template>

<style scoped>
.abp-account {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: var(--abp-canvas);
}

.abp-account__header {
  width: 100%;
  max-width: 28rem;
  margin-bottom: 1.5rem;
}

.abp-account__main {
  width: 100%;
  max-width: 28rem;
}
</style>
