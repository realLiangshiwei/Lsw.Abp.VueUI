<script setup lang="ts">
import {
  AbpPermission,
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
} from '@lsw-abpvue/core';
import { EmailSettingsService } from '@lsw-abpvue/setting-management/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSpinner,
  AbpToggle,
  useAbpForm,
  useServerValidation,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, onMounted, ref } from 'vue';
import { SettingManagementPolicyNames } from '../enums/policy-names.js';

const settings = injectAbp(EmailSettingsService);
const configState = injectAbp(ConfigStateService);
const localization = useLocalization();
const toaster = useToaster();
const messagesOf = useValidationMessages();

const loading = ref(true);
const busy = ref(false);
const testOpen = ref(false);
const testBusy = ref(false);

const form = useAbpForm({
  defaultFromDisplayName: { value: '', validators: [Validators.required()] },
  defaultFromAddress: { value: '', validators: [Validators.required(), Validators.email()] },
  smtpHost: { value: '' },
  smtpPort: { value: 25 as number, validators: [Validators.required()] },
  smtpEnableSsl: { value: false },
  smtpUseDefaultCredentials: { value: false },
  smtpDomain: { value: '' },
  smtpUserName: { value: '' },
  smtpPassword: { value: '' },
});

const testForm = useAbpForm({
  senderEmailAddress: { value: '', validators: [Validators.required(), Validators.email()] },
  targetEmailAddress: { value: '', validators: [Validators.required(), Validators.email()] },
  subject: { value: '', validators: [Validators.required()] },
  body: { value: '' },
});

useServerValidation({
  setServerErrors: errors => (testOpen.value ? testForm : form).setServerErrors(errors),
});

type Field = keyof typeof form.controls;
type TestField = keyof typeof testForm.controls;

const errorsOf = (name: Field) =>
  computed(() => (form.controls[name].touched ? messagesOf(form.controls[name].errors) : []));
const testErrorsOf = (name: TestField) =>
  computed(() =>
    testForm.controls[name].touched ? messagesOf(testForm.controls[name].errors) : [],
  );

const displayNameErrors = errorsOf('defaultFromDisplayName');
const addressErrors = errorsOf('defaultFromAddress');
const portErrors = errorsOf('smtpPort');
const senderErrors = testErrorsOf('senderEmailAddress');
const targetErrors = testErrorsOf('targetEmailAddress');
const subjectErrors = testErrorsOf('subject');

// The server never sends the password back, so an empty box means "leave it alone".
const credentialsShown = computed(() => !form.value.smtpUseDefaultCredentials);

onMounted(async () => {
  try {
    const current = await settings.get();
    form.patch({
      defaultFromDisplayName: current.defaultFromDisplayName ?? '',
      defaultFromAddress: current.defaultFromAddress ?? '',
      smtpHost: current.smtpHost ?? '',
      smtpPort: current.smtpPort,
      smtpEnableSsl: current.smtpEnableSsl,
      smtpUseDefaultCredentials: current.smtpUseDefaultCredentials,
      smtpDomain: current.smtpDomain ?? '',
      smtpUserName: current.smtpUserName ?? '',
      smtpPassword: '',
    });
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (!form.validate()) return;
  busy.value = true;

  try {
    await settings.update(form.value);
    form.controls.smtpPassword.reset('');
    toaster.success('AbpSettingManagement::SavedSuccessfully');
  } finally {
    busy.value = false;
  }
}

function openTest(): void {
  testForm.reset({
    senderEmailAddress: form.value.defaultFromAddress,
    // Whoever is asking for the test is the one who can go and look for it.
    targetEmailAddress: configState.getOne('currentUser').value.email ?? '',
    subject: localization.t(
      'AbpSettingManagement::TestEmailSubject',
      String(Math.floor(Math.random() * 9999)),
    ),
    body: localization.t('AbpSettingManagement::TestEmailBody'),
  });
  testOpen.value = true;
}

async function sendTest(): Promise<void> {
  if (!testForm.validate()) return;
  testBusy.value = true;

  try {
    await settings.sendTestEmail(testForm.value);
    testOpen.value = false;
    toaster.success('AbpSettingManagement::SentSuccessfully');
  } finally {
    testBusy.value = false;
  }
}
</script>

<template>
  <AbpSpinner v-if="loading" />

  <template v-else>
    <h2 class="h5 mb-3">{{ $t('AbpSettingManagement::Menu:Emailing') }}</h2>

    <form novalidate @submit.prevent="submit">
      <AbpFormField
        :label="localization.t('AbpSettingManagement::DefaultFromDisplayName')"
        required
        :errors="displayNameErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="form.controls.defaultFromDisplayName.value"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="form.controls.defaultFromDisplayName.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpFormField
        :label="localization.t('AbpSettingManagement::DefaultFromAddress')"
        required
        :errors="addressErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="form.controls.defaultFromAddress.value"
            type="email"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="form.controls.defaultFromAddress.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpFormField :label="localization.t('AbpSettingManagement::SmtpHost')">
        <template #default="{ id }">
          <AbpInput :id="id" v-model="form.controls.smtpHost.value" />
        </template>
      </AbpFormField>

      <AbpFormField
        :label="localization.t('AbpSettingManagement::SmtpPort')"
        required
        :errors="portErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="form.controls.smtpPort.value"
            type="number"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="form.controls.smtpPort.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpToggle
        v-model="form.controls.smtpEnableSsl.value"
        class="mb-2"
        :label="$t('AbpSettingManagement::SmtpEnableSsl')"
      />

      <AbpToggle
        v-model="form.controls.smtpUseDefaultCredentials.value"
        class="mb-3"
        :label="$t('AbpSettingManagement::SmtpUseDefaultCredentials')"
      />

      <template v-if="credentialsShown">
        <AbpFormField :label="localization.t('AbpSettingManagement::SmtpDomain')">
          <template #default="{ id }">
            <AbpInput :id="id" v-model="form.controls.smtpDomain.value" />
          </template>
        </AbpFormField>

        <AbpFormField :label="localization.t('AbpSettingManagement::SmtpUserName')">
          <template #default="{ id }">
            <AbpInput :id="id" v-model="form.controls.smtpUserName.value" autocomplete="username" />
          </template>
        </AbpFormField>

        <AbpFormField :label="localization.t('AbpSettingManagement::SmtpPassword')">
          <template #default="{ id }">
            <AbpInput
              :id="id"
              v-model="form.controls.smtpPassword.value"
              type="password"
              autocomplete="new-password"
              revealable
              :placeholder="$t('AbpSettingManagement::SmtpPasswordPlaceholder')"
            />
          </template>
        </AbpFormField>
      </template>

      <hr />

      <AbpButton type="submit" variant="primary" :loading="busy">
        {{ $t('AbpSettingManagement::Save') }}
      </AbpButton>

      <AbpPermission :policy="SettingManagementPolicyNames.EmailingTest">
        <AbpButton class="ms-2" variant="secondary" outline @click="openTest">
          {{ $t('AbpSettingManagement::SendTestEmail') }}
        </AbpButton>
      </AbpPermission>
    </form>

    <AbpModal v-model:visible="testOpen" size="lg" :busy="testBusy">
      <template #header>
        <h2 class="h5 mb-0">{{ $t('AbpSettingManagement::SendTestEmail') }}</h2>
      </template>

      <AbpFormField
        :label="localization.t('AbpSettingManagement::SenderEmailAddress')"
        required
        :errors="senderErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="testForm.controls.senderEmailAddress.value"
            type="email"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="testForm.controls.senderEmailAddress.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpFormField
        :label="localization.t('AbpSettingManagement::TargetEmailAddress')"
        required
        :errors="targetErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="testForm.controls.targetEmailAddress.value"
            type="email"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="testForm.controls.targetEmailAddress.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpFormField
        :label="localization.t('AbpSettingManagement::Subject')"
        required
        :errors="subjectErrors"
      >
        <template #default="{ id, describedBy, invalid }">
          <AbpInput
            :id="id"
            v-model="testForm.controls.subject.value"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="testForm.controls.subject.markAsTouched()"
          />
        </template>
      </AbpFormField>

      <AbpFormField :label="localization.t('AbpSettingManagement::Body')">
        <template #default="{ id }">
          <AbpInput :id="id" v-model="testForm.controls.body.value" type="textarea" :rows="4" />
        </template>
      </AbpFormField>

      <template #footer>
        <AbpButton variant="secondary" outline :disabled="testBusy" @click="testOpen = false">
          {{ $t('AbpUi::Close') }}
        </AbpButton>
        <AbpButton variant="primary" :loading="testBusy" @click="sendTest">
          {{ $t('AbpSettingManagement::Send') }}
        </AbpButton>
      </template>
    </AbpModal>
  </template>
</template>
