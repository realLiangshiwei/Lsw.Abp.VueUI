<template>
  <div v-if="password" class="mb-3">
    <progress
      role="progressbar"
      :value="score"
      max="5"
      :aria-label="localization.t('AbpAccount::Strength')"
      :aria-valuetext="localization.t(label)"
    />
    <span class="ms-2"
      >{{ localization.t('AbpAccount::Strength') }}: {{ localization.t(label) }}</span
    >
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useLocalization } from '@lsw-abpvue/core';
const localization = useLocalization();
const props = defineProps<{ password: string }>();
const score = computed(
  () =>
    [
      props.password.length >= 6,
      /[0-9]/.test(props.password),
      /[a-z ]/.test(props.password),
      /[A-Z]/.test(props.password),
      /[^a-zA-Z0-9 ]/.test(props.password),
    ].filter(Boolean).length,
);
const label = computed(
  () => `AbpAccount::${['Weak', 'Fair', 'Normal', 'Good', 'Strong'][Math.max(0, score.value - 1)]}`,
);
</script>
