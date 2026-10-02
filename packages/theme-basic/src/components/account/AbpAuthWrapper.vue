<script setup lang="ts">
import { AccountComponents, useAuthWrapper } from '@lsw-abpvue/account-core';
import { useReplaceableComponents } from '@lsw-abpvue/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AbpTenantBox from './AbpTenantBox.vue';

const wrapper = useAuthWrapper();
const replaceable = useReplaceableComponents();
const route = useRoute();

const tenantBox = computed(
  () => replaceable.getRef(AccountComponents.TenantBox).value ?? AbpTenantBox,
);

/** A password reset link is issued by one tenant, so that page does not offer a switch. */
const showTenantBox = computed(
  () => wrapper.isTenantBoxVisible.value && route.meta.tenantBoxVisible !== false,
);
</script>

<template>
  <div class="abp-auth-wrapper mx-auto">
    <component :is="tenantBox" v-if="showTenantBox" />

    <div v-if="wrapper.isLocalLoginEnabled.value" class="abp-auth-wrapper__card card">
      <div class="card-body p-4 p-md-5">
        <slot />
      </div>
    </div>

    <div v-else class="alert alert-warning" role="alert">
      <strong>{{ $t('AbpAccount::InvalidLoginRequest') }}</strong>
      {{ $t('AbpAccount::ThereAreNoLoginSchemesConfiguredForThisClient') }}
    </div>
  </div>
</template>

<style scoped>
.abp-auth-wrapper {
  width: 100%;
  max-width: 28rem;
}

.abp-auth-wrapper__card {
  box-shadow: var(--abp-shadow);
}
</style>
