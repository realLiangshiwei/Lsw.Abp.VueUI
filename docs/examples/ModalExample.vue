<template>
  <AbpButton @click="open">Edit title</AbpButton>
  <AbpModal v-model:visible="visible" :busy="saving" :dirty="draft !== saved" centered>
    <template #header><h2 class="h5 mb-0">Edit title</h2></template>
    <AbpFormField v-slot="{ id }" label="Title"
      ><AbpInput :id="id" v-model="draft" :disabled="saving"
    /></AbpFormField>
    <template #footer="{ close }">
      <AbpButton variant="secondary" :disabled="saving" @click="close">Cancel</AbpButton>
      <AbpButton :loading="saving" :disabled="!draft.trim()" @click="save">Save</AbpButton>
    </template>
  </AbpModal>
  <AbpConfirmHost />
  <output aria-live="polite">Saved title: {{ saved }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  AbpButton,
  AbpConfirmHost,
  AbpFormField,
  AbpInput,
  AbpModal,
} from '@lsw-abpvue/theme-shared';
const saved = ref('1984');
const draft = ref('');
const visible = ref(false);
const saving = ref(false);
function open(): void {
  draft.value = saved.value;
  visible.value = true;
}
async function save(): Promise<void> {
  if (saving.value || !draft.value.trim()) return;
  saving.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    saved.value = draft.value;
    visible.value = false;
  } finally {
    saving.value = false;
  }
}
</script>
