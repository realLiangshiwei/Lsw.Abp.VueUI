<template>
  <div class="card">
    <div class="card-body">
      <h1 class="h4">{{ $t('AbpUi::Welcome') }}</h1>
      <p class="text-body-secondary">{{ $t('__APP_NAME__::LongWelcomeMessage') }}</p>

      <p v-if="isAuthenticated" class="mb-0">{{ user.userName }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isAuthenticated } = useCurrentUser();
</script>
