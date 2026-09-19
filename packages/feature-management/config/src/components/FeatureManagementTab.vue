<script setup lang="ts">
import { AbpFeatureManagement } from '@lsw-abpvue/feature-management';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { ref } from 'vue';

// The host's own features: provider `T` with no key is what the backend reads as "the
// current tenant", and on the settings page of a host application that is the host.
const open = ref(false);
</script>

<template>
  <h2 class="h5 mb-3">{{ $t('AbpFeatureManagement::Permission:FeatureManagement') }}</h2>

  <p class="text-body-secondary">{{ $t('AbpFeatureManagement::ManageHostFeaturesText') }}</p>

  <AbpButton variant="primary" icon-class="bi bi-gear" @click="open = true">
    {{ $t('AbpFeatureManagement::ManageHostFeatures') }}
  </AbpButton>

  <AbpFeatureManagement v-model:visible="open" provider-name="T" />
</template>
