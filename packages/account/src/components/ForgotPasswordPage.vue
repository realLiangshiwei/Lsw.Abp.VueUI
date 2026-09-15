<script setup lang="ts">
import { AccountService } from '@lsw-abpvue/account-core/proxy';
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';
import { ACCOUNT_APP_NAME } from '../tokens/config-options.token.js';

const account = injectAbp(AccountService);
const appName = injectAbp(ACCOUNT_APP_NAME);
const localization = useLocalization();
const messagesOf = useValidationMessages();

const form = useAbpForm({
  email: { value: '', validators: [Validators.required(), Validators.email()] },
});

useServerValidation(form);

const busy = ref(false);
const sent = ref(false);

const emailErrors = computed(() =>
  form.controls.email.touched ? messagesOf(form.controls.email.errors) : [],
);

async function submit(): Promise<void> {
  if (!form.validate()) return;

  busy.value = true;

  try {
    await account.sendPasswordResetCode({ email: form.value.email, appName });
    sent.value = true;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h1 class="h4 mb-3">{{ $t('AbpAccount::ForgotPassword') }}</h1>

  <template v-if="sent">
    <p role="status">{{ $t('AbpAccount::PasswordResetMailSentMessage') }}</p>
    <RouterLink to="/account/login">{{ $t('AbpAccount::BackToLogin') }}</RouterLink>
  </template>

  <template v-else>
    <p>{{ $t('AbpAccount::SendPasswordResetLink_Information') }}</p>

    <form novalidate @submit.prevent="submit">
      <AbpFormField
        :label="localization.t('AbpAccount::EmailAddress')"
        required
        :errors="emailErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="form.controls.email.value"
            type="email"
            name="email"
            autocomplete="email"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="form.controls.email.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <div class="d-flex gap-2">
        <AbpButton type="submit" variant="primary" :loading="busy">
          {{ $t('AbpAccount::ResetPassword') }}
        </AbpButton>
        <RouterLink class="btn btn-outline-secondary" to="/account/login">
          {{ $t('AbpAccount::Cancel') }}
        </RouterLink>
      </div>
    </form>
  </template>
</template>
