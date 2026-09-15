<script setup lang="ts">
import { AccountService } from '@lsw-abpvue/account-core/proxy';
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  usePasswordValidators,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const account = injectAbp(AccountService);
const localization = useLocalization();
const messagesOf = useValidationMessages();
const route = useRoute();

/** Both come out of the link ABP mailed; without them there is nothing to reset. */
const userId = String(route.query.userId ?? '');
const resetToken = String(route.query.resetToken ?? '');
const linkIsUsable = Boolean(userId && resetToken);

const passwordRules = usePasswordValidators();

const form = useAbpForm({
  password: { value: '', validators: [Validators.required(), ...passwordRules] },
  confirmPassword: {
    value: '',
    validators: [Validators.required(), Validators.compare('password')],
  },
});

useServerValidation(form);

const busy = ref(false);
const done = ref(false);

const errorsOf = (name: 'password' | 'confirmPassword') =>
  computed(() => (form.controls[name].touched ? messagesOf(form.controls[name].errors) : []));

const passwordErrors = errorsOf('password');
const confirmErrors = errorsOf('confirmPassword');

async function submit(): Promise<void> {
  if (!form.validate()) return;

  busy.value = true;

  try {
    await account.resetPassword({ userId, resetToken, password: form.value.password });
    done.value = true;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h1 class="h4 mb-3">{{ $t('AbpAccount::ResetPassword') }}</h1>

  <template v-if="done">
    <p role="status">{{ $t('AbpAccount::YourPasswordIsSuccessfullyReset') }}</p>
    <RouterLink to="/account/login">{{ $t('AbpAccount::GoToTheApplication') }}</RouterLink>
  </template>

  <template v-else-if="!linkIsUsable">
    <p role="alert">{{ $t('AbpAccount::InvalidLoginRequest') }}</p>
    <RouterLink to="/account/login">{{ $t('AbpAccount::BackToLogin') }}</RouterLink>
  </template>

  <template v-else>
    <p>{{ $t('AbpAccount::ResetPassword_Information') }}</p>

    <form novalidate @submit.prevent="submit">
      <AbpFormField
        :label="localization.t('AbpAccount::DisplayName:NewPassword')"
        required
        :errors="passwordErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="form.controls.password.value"
            type="password"
            name="password"
            autocomplete="new-password"
            revealable
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="form.controls.password.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpFormField
        :label="localization.t('AbpAccount::ConfirmPassword')"
        required
        :errors="confirmErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="form.controls.confirmPassword.value"
            type="password"
            name="confirmPassword"
            autocomplete="new-password"
            revealable
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="form.controls.confirmPassword.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpButton type="submit" variant="primary" block :loading="busy">
        {{ $t('AbpAccount::ResetPassword') }}
      </AbpButton>
    </form>
  </template>
</template>
