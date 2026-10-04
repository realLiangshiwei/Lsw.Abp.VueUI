<template>
  <form @submit.prevent="save">
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
    <p v-for="message in form.unmatchedServerErrors" :key="message" role="alert">
      {{ message }}
    </p>
    <AbpButton type="submit" :loading="saving">{{ localization.t('AbpUi::Save') }}</AbpButton>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { inject, RestService, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';

const rest = inject(RestService);
const localization = useLocalization();
const form = useAbpForm({
  name: { value: '', validators: [Validators.required(), Validators.maxLength(128)] },
});
useServerValidation(form);
const validationMessages = useValidationMessages();
const messages = computed(() =>
  form.controls.name.touched ? validationMessages(form.controls.name.errors) : [],
);
const saving = ref(false);

async function save(): Promise<void> {
  if (saving.value || !form.validate()) return;
  saving.value = true;
  try {
    await rest.request<{ name: string }, unknown>({
      method: 'POST',
      url: '/api/app/product',
      body: form.value,
    });
    form.reset();
  } catch {
    // Framework handlers report errors; keep the entered values for correction.
  } finally {
    saving.value = false;
  }
}
</script>
