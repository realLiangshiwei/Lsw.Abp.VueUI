<template>
  <div class="d-flex flex-wrap gap-2 align-items-center">
    <AbpButton icon-class="bi bi-check-lg" :loading="saving" @click="save">Save</AbpButton>
    <AbpButton variant="secondary" outline size="sm" @click="count = 0">Reset count</AbpButton>
    <AbpButton variant="danger" disabled>Delete</AbpButton>
    <AbpButton variant="secondary" outline aria-label="Refresh" @click="count++">
      <template #icon><i class="bi bi-arrow-clockwise" aria-hidden="true" /></template>
    </AbpButton>
  </div>
  <output aria-live="polite">Completed saves: {{ count }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpButton } from '@lsw-abpvue/theme-shared';

const saving = ref(false);
const count = ref(0);
async function save(): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  try {
    // A local delay demonstrates loading; replace it with your API request.
    await new Promise(resolve => setTimeout(resolve, 800));
    count.value++;
  } finally {
    saving.value = false;
  }
}
</script>
