<template>
  <AbpReplaceable replaceable-key="Account.InviteComponent">
    <main>
      <h1>{{ localization.t('AbpIdentity::AcceptInvitation') }}</h1>
      <AbpSpinner v-if="loading" />
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="completed" role="status">{{ completed }}</p>
      <AbpButton v-if="failed || uncertain" :disabled="busy" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
      <template v-if="info && !completed">
        <p>
          {{ info.inviteeEmail }} ·
          {{ info.tenantName || localization.t('AbpAccount::HostDisplayName') }}
        </p>
        <form :id="formId" novalidate @submit.prevent="accept">
          <AbpFormField
            v-if="info.requireRegister"
            v-slot="field"
            :label="localization.t('AbpAccount::UserName')"
            required
            ><AbpInput
              :id="field.id"
              v-model="userName"
              name="invitationUserName"
              :disabled="busy || uncertain"
              autocomplete="username"
          /></AbpFormField>
          <AbpFormField
            v-if="info.requireRegister"
            v-slot="field"
            :label="localization.t('AbpAccount::Password')"
            :errors="passwordErrors"
            required
            ><AbpInput
              :id="field.id"
              v-model="password"
              name="invitationPassword"
              type="password"
              :disabled="busy || uncertain"
              :invalid="field.invalid"
              :aria-describedby="field.describedBy"
              autocomplete="new-password"
              @blur="registrationForm.controls.password.markAsTouched()"
          /></AbpFormField>
          <PasswordStrength v-if="info.requireRegister" :password="password" />
          <AbpFormField
            v-if="info.requireRegister"
            v-slot="field"
            :label="localization.t('AbpAccount::ConfirmPassword')"
            :errors="confirmationErrors"
            required
            ><AbpInput
              :id="field.id"
              v-model="registrationForm.controls.confirmPassword.value"
              name="invitationPasswordConfirm"
              type="password"
              :disabled="busy || uncertain"
              :invalid="field.invalid"
              :aria-describedby="field.describedBy"
              autocomplete="new-password"
              @blur="registrationForm.controls.confirmPassword.markAsTouched()"
          /></AbpFormField>
          <div class="d-flex flex-wrap gap-2">
            <AbpButton type="submit" :disabled="busy || loading || failed || uncertain">{{
              localization.t(
                info.requireRegister
                  ? 'AbpIdentity::RegisterAndAcceptInvitation'
                  : 'AbpIdentity::AcceptInvitation',
              )
            }}</AbpButton
            ><AbpButton
              variant="danger"
              :disabled="busy || loading || failed || uncertain"
              @click="reject"
              >{{ localization.t('AbpAccount::RejectInvitation') }}</AbpButton
            >
          </div>
        </form>
      </template>
      <AbpButton v-if="completed" :disabled="busy" :loading="busy" @click="signIn">{{
        localization.t('AbpAccount::Login')
      }}</AbpButton>
    </main>
  </AbpReplaceable>
</template>
<script setup lang="ts">
import { TenantBoxService } from '@lsw-abpvue/account-core';
import {
  AbpReplaceable,
  AuthService,
  inject as injectAbp,
  useLocalization,
  WindowService,
} from '@lsw-abpvue/core';
import { UserSharingService } from '@lsw-abpvue/account-pro/proxy';
import type { InvitationInfoDto } from '@lsw-abpvue/account-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpSpinner,
  ConfirmationService,
  useAbpForm,
  usePasswordValidators,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PasswordStrength from './PasswordStrength.vue';
const service = injectAbp(UserSharingService);
const auth = injectAbp(AuthService);
const tenantBox = injectAbp(TenantBoxService);
const windowService = injectAbp(WindowService);
const confirmation = injectAbp(ConfirmationService);
const localization = useLocalization();
const route = useRoute();
const router = useRouter();
const formId = useId();
const info = ref<InvitationInfoDto>();
const userName = ref('');
const passwordValidators = usePasswordValidators();
const registrationForm = useAbpForm({
  password: { value: '', validators: [Validators.required(), ...passwordValidators] },
  confirmPassword: {
    value: '',
    validators: [
      Validators.required(),
      ...passwordValidators,
      Validators.compare('password', 'AbpIdentity::PasswordsAreNotSame'),
    ],
  },
});
const password = computed({
  get: () => registrationForm.controls.password.value,
  set: (value: string) => {
    registrationForm.controls.password.value = value;
  },
});
const validationMessages = useValidationMessages();
const passwordErrors = computed(() =>
  registrationForm.controls.password.touched
    ? validationMessages(registrationForm.controls.password.errors)
    : [],
);
const confirmationErrors = computed(() =>
  registrationForm.controls.confirmPassword.touched
    ? validationMessages(registrationForm.controls.confirmPassword.errors)
    : [],
);
const loading = ref(false);
const busy = ref(false);
const failed = ref(false);
const uncertain = ref(false);
const error = ref('');
const completed = ref('');
const acceptedInvitation = ref<InvitationInfoDto>();
let token = '';
let revision = 0;
let disposed = false;
let controller = new AbortController();
function current(own: number) {
  return !disposed && own === revision;
}
function actionableInvitation(
  value: InvitationInfoDto | null | undefined,
): value is InvitationInfoDto {
  return Boolean(
    value &&
    typeof value.inviteeEmail === 'string' &&
    value.inviteeEmail.trim() &&
    typeof value.requireRegister === 'boolean' &&
    (value.requireRegister || value.suggestedUserName?.trim()),
  );
}
function failRead() {
  info.value = undefined;
  userName.value = '';
  registrationForm.reset({ password: '', confirmPassword: '' });
  failed.value = true;
  error.value = localization.t('AbpAccount::InvitationLinkIsInvalid');
}
async function load() {
  if (!token || busy.value || disposed) return;
  const own = ++revision;
  controller.abort();
  controller = new AbortController();
  loading.value = true;
  failed.value = false;
  info.value = undefined;
  error.value = '';
  try {
    const result = await service.getInvitationByToken(token, {
      signal: controller.signal,
      skipHandleError: true,
    });
    if (!current(own)) return;
    if (!actionableInvitation(result)) {
      failRead();
      return;
    }
    info.value = result;
    if (!result.requireRegister || !userName.value) userName.value = result.suggestedUserName ?? '';
    uncertain.value = false;
  } catch {
    if (current(own)) failRead();
  } finally {
    if (current(own)) loading.value = false;
  }
}
async function act(action: () => Promise<void>, message: string, onSuccess?: () => void) {
  if (
    !token ||
    !info.value ||
    loading.value ||
    busy.value ||
    failed.value ||
    uncertain.value ||
    disposed
  )
    return;
  const own = revision;
  busy.value = true;
  error.value = '';
  try {
    await action();
    if (!current(own)) return;
    onSuccess?.();
    completed.value = message;
    registrationForm.reset({ password: '', confirmPassword: '' });
    token = '';
    info.value = undefined;
  } catch {
    if (current(own)) {
      uncertain.value = true;
      error.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
  } finally {
    if (current(own)) busy.value = false;
  }
}
async function accept() {
  const invitation = info.value;
  if (!userName.value.trim()) {
    error.value = localization.t('AbpValidation::ThisFieldIsRequired.');
    return;
  }
  if (info.value?.requireRegister && !registrationForm.validate()) return;
  await act(
    () =>
      service.acceptInvitation(
        {
          token,
          userName: userName.value.trim(),
          ...(info.value?.requireRegister ? { password: password.value } : {}),
        },
        { signal: controller.signal, skipHandleError: true },
      ),
    localization.t(
      'AbpAccount::YouHaveSuccessfullyJoinedTheTenant',
      invitation?.tenantName || localization.t('AbpAccount::HostDisplayName'),
    ),
    () => {
      acceptedInvitation.value = invitation;
    },
  );
}
async function reject() {
  const own = revision;
  if (busy.value || loading.value || uncertain.value || !info.value) return;
  const result = await confirmation.warn(
    localization.t('AbpAccount::RejectInvitation'),
    'AbpUi::AreYouSure',
  );
  if (result === 'confirm' && current(own))
    await act(
      () =>
        service.rejectInvitation({ token }, { signal: controller.signal, skipHandleError: true }),
      localization.t('AbpUi::SavedSuccessfully'),
    );
}
async function signIn() {
  if (busy.value) return;
  busy.value = true;
  try {
    const invitation = acceptedInvitation.value;
    if (invitation) {
      if (invitation.tenantId && !invitation.tenantName) {
        error.value = localization.t('AbpUi::ErrorLoadingDatatable');
        return;
      }
      await auth.clearSession?.();
      if (!(await tenantBox.switchTo(invitation.tenantName ?? ''))) {
        error.value = localization.t('AbpUi::ErrorLoadingDatatable');
        return;
      }
    }
    await auth.navigateToLogin('/account/workflows?section=tenants');
  } catch {
    error.value = localization.t('AbpUi::ErrorLoadingDatatable');
  } finally {
    if (!disposed) busy.value = false;
  }
}
async function consumeToken(value: string) {
  const own = ++revision;
  controller.abort();
  controller = new AbortController();
  token = value;
  info.value = undefined;
  userName.value = '';
  registrationForm.reset({ password: '', confirmPassword: '' });
  completed.value = '';
  acceptedInvitation.value = undefined;
  failed.value = false;
  uncertain.value = false;
  busy.value = false;
  const query = { ...route.query };
  delete query.token;
  delete query.Token;
  const native = windowService.nativeWindow;
  if (native) {
    const url = new URL(native.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('Token');
    native.history.replaceState(
      native.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }
  await router.replace({ query, hash: route.hash });
  if (current(own)) await load();
}
watch(
  () => route.query.token ?? route.query.Token,
  value => {
    if (typeof value === 'string' && value && value !== token) void consumeToken(value);
    else if (!token && !completed.value)
      error.value = localization.t('AbpAccount::InvitationLinkIsInvalid');
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  disposed = true;
  revision++;
  controller.abort();
  token = '';
  registrationForm.reset({ password: '', confirmPassword: '' });
});
</script>
