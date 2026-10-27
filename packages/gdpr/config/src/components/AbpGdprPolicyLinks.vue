<template>
  <template v-for="(part, index) in parts" :key="index">
    <RouterLink v-if="part.link && !part.link.external" :to="part.link.url">
      {{ $t(part.link.text) }}
    </RouterLink>
    <a v-else-if="part.link" :href="part.link.url" target="_blank" rel="noopener noreferrer">
      {{ $t(part.link.text) }}
    </a>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<script setup lang="ts">
import { inject, LocalizationService, WindowService } from '@lsw-abpvue/core';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { AbpCookieConsentOptions } from '../models/options.js';

const props = defineProps<{ link: AbpCookieConsentOptions }>();
const localization = inject(LocalizationService);
const platform = inject(WindowService);
const links = computed(() =>
  [
    [props.link.cookiePolicyUrl, 'AbpGdpr::CookiePolicy'],
    [props.link.privacyPolicyUrl, 'AbpGdpr::PrivacyPolicy'],
  ].flatMap(([value, text]) => {
    if (!value || !text) return [];
    try {
      const base = platform.nativeWindow?.location.origin ?? 'http://localhost';
      const url = new URL(value, base);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];
      return [
        {
          url: url.origin === base ? `${url.pathname}${url.search}${url.hash}` : url.href,
          external: url.origin !== base,
          text,
        },
      ];
    } catch {
      return [];
    }
  }),
);
const parts = computed(() => {
  if (!links.value.length) return [];
  const key = links.value.length === 2 ? 'CookieConsentAgreePolicies' : 'CookieConsentAgreePolicy';
  return localization
    .t(`AbpGdpr::${key}`, '{0}', '{1}')
    .split(/(\{[01]\})/)
    .map(text => ({
      text,
      link: /^\{[01]\}$/.test(text) ? links.value[Number(text[1])] : undefined,
    }));
});
</script>
