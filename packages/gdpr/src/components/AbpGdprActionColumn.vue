<template>
  <AbpButton
    v-if="ready"
    :disabled="busy !== null"
    :loading="busy === record.id"
    @click="page.getUserData(record)"
  >
    {{ $t('AbpGdpr::Download') }}
  </AbpButton>
  <span v-else role="status">{{ $t('AbpGdpr::Preparing') }}</span>
</template>

<script setup lang="ts">
import { inject } from '@lsw-abpvue/core';
import type { GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';
import { GDPR_PAGE } from '../tokens/page.token.js';

const props = defineProps<{ record: GdprRequestDto }>();
const page = inject(GDPR_PAGE);
const { busy } = page;
const ready = computed(() => Date.parse(props.record.readyTime) < Date.now());
</script>
