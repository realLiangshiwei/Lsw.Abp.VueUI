<template>
  <form @submit.prevent="save">
    <p v-if="refreshFailed" role="alert">
      Saved, but application configuration could not be refreshed.
      <AbpButton variant="secondary" size="sm" @click="refreshConfiguration"
        >Retry refresh</AbpButton
      >
    </p>
    <p v-if="loading" role="status">Loading profile…</p>
    <p v-if="failed" role="alert">
      Profile could not be loaded. <button type="button" @click="load">Retry</button>
    </p>
    <AbpFormField v-slot="{ id, describedBy, invalid }" label="Phone number" :errors="errors">
      <AbpInput
        :id="id"
        v-model="form.controls.phoneNumber.value"
        type="tel"
        :maxlength="32"
        :disabled="loading || failed || saving"
        :invalid="invalid"
        :aria-describedby="describedBy"
      />
    </AbpFormField>
    <AbpButton type="submit" :loading="saving" :disabled="loading || failed">Save</AbpButton>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { ConfigStateService, inject } from '@lsw-abpvue/core';
import { ManageProfileStateService } from '@lsw-abpvue/account-core';
import { ProfileService, type ProfileDto } from '@lsw-abpvue/account-core/proxy';
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
const service = inject(ProfileService);
const state = inject(ManageProfileStateService);
const config = inject(ConfigStateService);
const toaster = useToaster();
const original = shallowRef<ProfileDto>();
const form = useAbpForm({ phoneNumber: { value: '', validators: [Validators.maxLength(32)] } });
useServerValidation(form);
const messages = useValidationMessages();
const errors = computed(() =>
  form.controls.phoneNumber.touched ? messages(form.controls.phoneNumber.errors) : [],
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
    original.value = await service.get({ signal: controller.signal });
    form.reset({ phoneNumber: original.value.phoneNumber ?? '' });
  } catch {
    if (!controller.signal.aborted) failed.value = true;
  } finally {
    loading.value = false;
  }
}
async function save(): Promise<void> {
  if (!original.value || saving.value || !form.validate()) return;
  saving.value = true;
  try {
    const result = await service.update(
      {
        userName: original.value.userName,
        email: original.value.email,
        name: original.value.name,
        surname: original.value.surname,
        concurrencyStamp: original.value.concurrencyStamp,
        extraProperties: original.value.extraProperties,
        phoneNumber: form.value.phoneNumber,
      },
      { signal: controller.signal },
    );
    original.value = result;
    state.set(result);
    form.reset({ phoneNumber: result.phoneNumber ?? '' });
    await refreshConfiguration();
    toaster.success('AbpUi::SavedSuccessfully');
  } catch {
    /* Request handlers report errors; keep the entered phone number. */
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
