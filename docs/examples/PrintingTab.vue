<template>
  <form @submit.prevent="save">
    <p v-if="refreshFailed" role="alert">
      Saved, but application configuration could not be refreshed.
      <AbpButton variant="secondary" size="sm" @click="refreshConfiguration"
        >Retry refresh</AbpButton
      >
    </p>
    <p v-if="loading" role="status">Loading printing settings…</p>
    <p v-if="failed" role="alert">
      Settings could not be loaded. <button type="button" @click="load">Retry</button>
    </p>
    <AbpFormField
      v-slot="{ id, describedBy, invalid }"
      label="Default copies"
      :errors="errors"
      required
    >
      <AbpInput
        :id="id"
        v-model="form.controls.copies.value"
        type="number"
        :min="1"
        :max="20"
        :disabled="loading || failed || saving"
        :invalid="invalid"
        :aria-describedby="describedBy"
      />
    </AbpFormField>
    <AbpButton type="submit" :loading="saving" :disabled="loading || failed">Save</AbpButton>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ConfigStateService, inject, RestService } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  useServerValidation,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';

interface PrintingSettings {
  copies: number;
}
const rest = inject(RestService);
const config = inject(ConfigStateService);
const toaster = useToaster();
const form = useAbpForm<{ copies: number | null }>({
  copies: { value: 1, validators: [Validators.required(), Validators.range(1, 20)] },
});
useServerValidation(form);
const messages = useValidationMessages();
const errors = computed(() =>
  form.controls.copies.touched ? messages(form.controls.copies.errors) : [],
);
const loading = ref(true);
const failed = ref(false);
const saving = ref(false);
const refreshFailed = ref(false);
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
onMounted(load);
async function load(): Promise<void> {
  loading.value = true;
  failed.value = false;
  try {
    const result = await rest.request<never, PrintingSettings>(
      { method: 'GET', url: '/api/app/printing-settings' },
      { signal: controller.signal },
    );
    form.reset(result);
  } catch {
    if (!controller.signal.aborted) failed.value = true;
  } finally {
    loading.value = false;
  }
}
async function save(): Promise<void> {
  if (saving.value || loading.value || failed.value || !form.validate()) return;
  saving.value = true;
  try {
    await rest.request(
      { method: 'PUT', url: '/api/app/printing-settings', body: form.value },
      { signal: controller.signal },
    );
    form.reset(form.value);
    await refreshConfiguration();
    toaster.success('AbpUi::SavedSuccessfully');
  } catch {
    /* Request handlers report errors; preserve the form. */
  } finally {
    saving.value = false;
  }
}
async function refreshConfiguration(): Promise<void> {
  refreshFailed.value = false;
  try {
    await config.refreshAppState();
  } catch {
    refreshFailed.value = true;
  }
}
</script>
