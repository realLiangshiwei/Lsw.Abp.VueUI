<template>
  <form @submit.prevent="submit">
    <AbpFormField
      v-slot="{ id, describedBy, invalid }"
      label="Email"
      hint="Enter an email address"
      :errors="errors"
      required
    >
      <AbpInput
        :id="id"
        v-model="form.controls.email.value"
        type="email"
        :aria-describedby="describedBy"
        :invalid="invalid"
        @blur="form.controls.email.markAsTouched()"
      />
    </AbpFormField>
    <AbpButton type="submit">Validate</AbpButton>
    <AbpButton variant="secondary" class="ms-2" @click="form.reset()">Reset</AbpButton>
  </form>
  <output>Valid: {{ form.valid }}; dirty: {{ form.dirty }}; submitted: {{ submitted }}</output>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
const form = useAbpForm({
  email: {
    value: '',
    validators: [
      Validators.required({ key: 'Demo::Required', defaultValue: 'Email is required' }),
      Validators.email({ key: 'Demo::Email', defaultValue: 'Enter a valid email' }),
    ],
  },
});
const messages = useValidationMessages();
const errors = computed(() =>
  form.controls.email.touched ? messages(form.controls.email.errors) : [],
);
const submitted = ref(false);
function submit(): void {
  submitted.value = form.validate();
}
</script>
