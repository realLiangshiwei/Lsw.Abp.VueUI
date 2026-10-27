<template>
  <AbpReplaceable :replaceable-key="GdprConfigComponents.CookieConsent">
    <div
      v-if="options.isEnabled && visible"
      id="cookieConsent"
      class="abp-cookie-consent"
      role="alert"
    >
      <p>
        {{ $t('AbpGdpr::ThisWebsiteUsesCookie') }}
        <AbpGdprPolicyLinks :link="options" />
      </p>
      <AbpButton size="sm" variant="info" @click="acceptCookie">
        {{ $t('AbpGdpr::Accept') }}
      </AbpButton>
    </div>
  </AbpReplaceable>
</template>

<script setup lang="ts">
import { AbpReplaceable, CookieService, inject, WindowService } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { onMounted, ref } from 'vue';
import { GdprConfigComponents } from '../enums/components.js';
import { CookieConsentService } from '../services/cookie-consent.service.js';
import AbpGdprPolicyLinks from './AbpGdprPolicyLinks.vue';

const cookies = inject(CookieService);
const platform = inject(WindowService);
const options = inject(CookieConsentService).cookieConsentOptions;
const visible = ref(false);
onMounted(() => {
  visible.value = !!platform.nativeWindow && cookies.get('.AspNet.Consent') !== 'true';
});

function acceptCookie(): void {
  const expires = options.value.expireDate;
  if (!platform.nativeWindow || !(expires instanceof Date) || !Number.isFinite(expires.getTime()))
    return;
  cookies.set('.AspNet.Consent', 'true', { expires, path: '/' });
  visible.value = false;
}
</script>

<style scoped src="../../../src/styles/style.css"></style>
