<template>
  <AbpButton variant="danger" @click="confirmAction">{{ $t('AbpUi::Delete') }}</AbpButton>
</template>

<script setup lang="ts">
import {
  AbpButton,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';

const confirmation = useConfirmation();
const toaster = useToaster();
async function confirmAction(): Promise<void> {
  const status = await confirmation.warn('AbpUi::AreYouSure', 'AbpUi::AreYouSure');
  if (status !== ConfirmationStatus.confirm) return;
  // Perform the business operation here, then report success.
  toaster.success('AbpUi::SuccessfullyDeleted');
}
</script>
