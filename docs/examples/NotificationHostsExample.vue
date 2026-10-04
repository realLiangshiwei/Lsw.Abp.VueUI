<template>
  <div class="d-flex gap-2">
    <AbpButton @click="notify">Show notification</AbpButton>
    <AbpButton variant="danger" outline @click="confirm">Ask for confirmation</AbpButton>
  </div>
  <AbpToastHost container-key="example" />
  <AbpConfirmHost />
  <output aria-live="polite">{{ result }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  AbpButton,
  AbpConfirmHost,
  AbpToastHost,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
const toaster = useToaster();
const confirmation = useConfirmation();
const result = ref('No answer yet');
function notify(): void {
  toaster.success({ key: 'Demo::Saved', defaultValue: 'Changes saved' }, undefined, {
    containerKey: 'example',
    life: 3000,
  });
}
async function confirm(): Promise<void> {
  const answer = await confirmation.warn(
    { key: 'Demo::Delete', defaultValue: 'Delete this book?' },
    { key: 'Demo::Title', defaultValue: 'Confirm deletion' },
  );
  result.value =
    answer === ConfirmationStatus.confirm
      ? 'Confirmed; the application would now call its delete API.'
      : `No deletion: ${answer}`;
}
</script>
