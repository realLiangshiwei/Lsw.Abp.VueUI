<script setup lang="ts">
import { useEnvironment } from '@lsw-abpvue/core';

const environment = useEnvironment().getEnvironment$();
</script>

<template>
  <RouterLink class="abp-logo navbar-brand" to="/">
    <img
      v-if="environment.application.logoUrl"
      :src="environment.application.logoUrl"
      :alt="environment.application.name"
      height="28"
    />
    <template v-else>
      <span class="abp-logo__mark" aria-hidden="true"><i class="bi bi-grid-1x2-fill" /></span>
      <span class="abp-logo__text">{{ environment.application.name }}</span>
    </template>
  </RouterLink>
</template>

<style scoped>
.abp-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  color: var(--abp-text);
  font-size: 1.125rem;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.abp-logo__mark {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  background: var(--abp-accent);
  color: var(--abp-accent-fg);
  font-size: 1rem;
}

@media (max-width: 991.98px) {
  .abp-logo {
    min-width: 0;
    max-width: 100%;
  }

  .abp-logo__mark {
    flex-shrink: 0;
  }

  .abp-logo__text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
