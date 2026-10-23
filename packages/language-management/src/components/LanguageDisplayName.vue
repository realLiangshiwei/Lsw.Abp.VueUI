<template>
  <strong v-if="record.isDefaultLanguage">
    {{ record.displayName }} ({{ $t('LanguageManagement::DefaultLanguage') }})
  </strong>
  <span v-else>{{ record.displayName }}</span>
</template>

<script setup lang="ts">
import type { LanguageDto } from '@lsw-abpvue/language-management/proxy';

defineProps<{ record: LanguageDto }>();
</script>
