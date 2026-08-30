<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';

// Switching language refetches that culture's texts; every `$t` on the page follows,
// with nothing remounted.
const localization = useLocalization();
</script>

<template>
  <label>
    {{ $t('AbpUi::Language') }}
    <select
      :value="localization.currentLang.value"
      @change="localization.setLanguage(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="language in localization.languages.value"
        :key="language.cultureName"
        :value="language.cultureName"
      >
        {{ language.displayName }}
      </option>
    </select>
  </label>
</template>
