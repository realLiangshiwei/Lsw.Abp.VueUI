<template>
  <AbpModal
    :visible="service.visible.value"
    :busy="service.busy.value"
    @update:visible="$event || service.staySignedIn()"
  >
    <template #header>{{ $t('AbpAccount::YourSessionIsAboutToExpire') }}</template>
    <p>{{ $t('AbpAccount::YourSessionIsAboutToExpireInfo') }}</p>
    <p v-if="service.failed.value" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <template #footer>
      <AbpButton variant="secondary" :disabled="service.busy.value" @click="service.logout"
        >{{ $t('AbpAccount::IdleSignOutNow') }} ({{ service.countdown.value }})</AbpButton
      >
      <AbpButton :disabled="service.busy.value" @click="service.staySignedIn">{{
        $t('AbpAccount::IdleStaySignedIn')
      }}</AbpButton>
    </template>
  </AbpModal>
</template>
<script setup lang="ts">
import { inject as injectAbp } from '@lsw-abpvue/core';
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';
import { onMounted, onScopeDispose } from 'vue';
import { IdleSessionService } from '../services/idle-session.service.js';
const service = injectAbp(IdleSessionService);
onMounted(service.start);
onScopeDispose(service.stop);
</script>
