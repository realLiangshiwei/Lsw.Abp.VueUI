<template>
  <AbpButton @click="open">{{ localization.t('AbpUi::New') }}</AbpButton>
  <AbpModal v-model:visible="visible" :busy="saving" :dirty="form.dirty" size="lg" centered>
    <template #header
      ><h2>{{ localization.t('BookStore::Product') }}</h2></template
    >
    <AbpFormField
      v-slot="{ id, describedBy, invalid }"
      :label="localization.t('AbpIdentity::DisplayName:Name')"
      :errors="messages"
      required
    >
      <AbpInput
        :id="id"
        v-model="form.controls.name.value"
        :aria-describedby="describedBy"
        :invalid="invalid"
        :disabled="saving"
      />
    </AbpFormField>
    <p v-for="message in form.unmatchedServerErrors" :key="message" role="alert">{{ message }}</p>
    <template #footer="{ close }">
      <AbpButton variant="secondary" :disabled="saving" @click="close">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton :loading="saving" @click="save">{{ localization.t('AbpUi::Save') }}</AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { inject, RestService, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  useAbpForm,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';

const rest = inject(RestService);
const localization = useLocalization();
const visible = ref(false);
const saving = ref(false);
const form = useAbpForm({ name: { value: '', validators: [Validators.required()] } });
useServerValidation(form);
const validationMessages = useValidationMessages();
const messages = computed(() =>
  form.controls.name.touched ? validationMessages(form.controls.name.errors) : [],
);

function open(): void {
  form.reset();
  visible.value = true;
}

async function save(): Promise<void> {
  if (saving.value || !form.validate()) return;
  saving.value = true;
  try {
    await rest.request<{ name: string }, unknown>({
      method: 'POST',
      url: '/api/app/product',
      body: form.value,
    });
    visible.value = false;
    form.reset();
  } catch {
    // Global handlers display the failure; the dialog retains the entered values.
  } finally {
    saving.value = false;
  }
}
</script>
