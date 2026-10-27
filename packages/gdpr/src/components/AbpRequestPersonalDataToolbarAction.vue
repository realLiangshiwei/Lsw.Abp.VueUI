<template>
  <span :title="btnDisabled ? $t('AbpGdpr::Volo.Abp.Gdpr:010001') : undefined">
    <AbpButton
      size="sm"
      :disabled="btnDisabled"
      :loading="busy === 'request'"
      @click="page.requestPersonalDate"
    >
      {{ $t('AbpGdpr::RequestPersonalData') }}
    </AbpButton>
  </span>
</template>

<script setup lang="ts">
import { inject } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { GDPR_PAGE } from '../tokens/page.token.js';

defineOptions({ inheritAttrs: false });

const page = inject(GDPR_PAGE);
const { btnDisabled, busy } = page;
</script>
