<script setup lang="ts">
import { useManageProfileState } from '@lsw-abpvue/account-core';
import { ProfileService } from '@lsw-abpvue/account-core/proxy';
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  useAbpForm,
  usePasswordValidators,
  useServerValidation,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';

const profiles = injectAbp(ProfileService);
const state = useManageProfileState();
const localization = useLocalization();
const toaster = useToaster();
const messagesOf = useValidationMessages();

/**
 * An account created by an external provider has no password yet, so there is nothing to
 * ask for the current one. Once one is set the field is needed, which is why this is a
 * ref rather than a computed over the profile.
 */
const hasPassword = ref(state.profile.value?.hasPassword ?? true);

const rules = usePasswordValidators();

const form = useAbpForm({
  currentPassword: { value: '' },
  newPassword: { value: '', validators: [Validators.required(), ...rules] },
  repeatNewPassword: {
    value: '',
    validators: [Validators.required(), Validators.compare('newPassword')],
  },
});

useServerValidation(form);

const busy = ref(false);

const errorsOf = (name: 'currentPassword' | 'newPassword' | 'repeatNewPassword') =>
  computed(() => (form.controls[name].touched ? messagesOf(form.controls[name].errors) : []));

const currentErrors = errorsOf('currentPassword');
const newErrors = errorsOf('newPassword');
const repeatErrors = errorsOf('repeatNewPassword');

async function submit(): Promise<void> {
  const missingCurrent = hasPassword.value && !form.value.currentPassword;
  if (!form.validate() || missingCurrent) {
    form.controls.currentPassword.markAsTouched();
    return;
  }

  busy.value = true;

  try {
    await profiles.changePassword({
      ...(hasPassword.value ? { currentPassword: form.value.currentPassword } : {}),
      newPassword: form.value.newPassword,
    });

    form.reset();
    hasPassword.value = true;
    toaster.success('AbpAccount::PasswordChangedMessage', undefined, { life: 5000 });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h2 class="h5 mb-3">{{ $t('AbpUi::ChangePassword') }}</h2>

  <form novalidate @submit.prevent="submit">
    <AbpFormField
      v-if="hasPassword"
      :label="localization.t('AbpAccount::DisplayName:CurrentPassword')"
      required
      :errors="currentErrors"
    >
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.currentPassword.value"
          type="password"
          name="currentPassword"
          autocomplete="current-password"
          revealable
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.currentPassword.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpFormField
      :label="localization.t('AbpAccount::DisplayName:NewPassword')"
      required
      :errors="newErrors"
    >
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.newPassword.value"
          type="password"
          name="newPassword"
          autocomplete="new-password"
          revealable
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.newPassword.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpFormField
      :label="localization.t('AbpAccount::DisplayName:NewPasswordConfirm')"
      required
      :errors="repeatErrors"
    >
      <template #default="{ id, describedBy, invalid }">
        <AbpInput
          :id="id"
          v-model="form.controls.repeatNewPassword.value"
          type="password"
          name="repeatNewPassword"
          autocomplete="new-password"
          revealable
          :invalid="invalid"
          :aria-describedby="describedBy"
          @blur="form.controls.repeatNewPassword.markAsTouched()"
        />
      </template>
    </AbpFormField>

    <AbpButton type="submit" variant="primary" :loading="busy">
      {{ $t('AbpUi::Save') }}
    </AbpButton>
  </form>
</template>
