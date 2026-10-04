<template>
  <h2>{{ $t('BookStore::Catalogue') }}</h2>
  <p>{{ $t('BookStore::ResultCount', count) }}</p>
  <AbpButton :disabled="switching" @click="changeLanguage">Switch to {{ target }}</AbpButton>
  <output>{{ caption }}; current culture: {{ localization.currentLang.value }}</output>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLocalization } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
const localization = useLocalization();
const count = ref(3);
const caption = localization.tr('BookStore::Catalogue');
const switching = ref(false);
const target = computed(() => (localization.currentLang.value === 'en' ? 'zh-Hans' : 'en'));
async function changeLanguage(): Promise<void> {
  if (switching.value) return;
  switching.value = true;
  try {
    await localization.setLanguage(target.value);
  } catch {
    /* Keep the current page; the framework request handler reports failures. */
  } finally {
    switching.value = false;
  }
}
</script>
