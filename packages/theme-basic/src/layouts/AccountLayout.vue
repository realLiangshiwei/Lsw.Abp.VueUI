<script setup lang="ts">
import AbpConfirmHost from '../components/AbpConfirmHost.vue';
import AbpErrorPage from '../components/AbpErrorPage.vue';
import AbpLoaderBar from '../components/AbpLoaderBar.vue';
import AbpPageAlerts from '../components/AbpPageAlerts.vue';
import AbpToastHost from '../components/AbpToastHost.vue';
import AbpLogo from '../components/nav/AbpLogo.vue';
import AbpLanguages from '../components/nav/AbpLanguages.vue';
</script>

<template>
  <AbpLoaderBar />

  <div class="abp-account d-flex flex-column align-items-center justify-content-center">
    <header class="d-flex align-items-center gap-3 mb-3">
      <AbpLogo />
      <ul class="navbar-nav">
        <AbpLanguages />
      </ul>
    </header>

    <main class="card abp-account__card">
      <div class="card-body">
        <AbpPageAlerts />
        <slot />
      </div>
    </main>
  </div>

  <AbpToastHost />
  <AbpConfirmHost />
  <AbpErrorPage />
</template>

<style scoped>
.abp-account {
  min-height: 100vh;
  padding: 1rem;
}

.abp-account__card {
  width: 100%;
  max-width: 26rem;
}
</style>
