<template>
  <AbpModal
    :visible="true"
    :busy="busy"
    :dirty="form.dirty"
    @update:visible="$event || emit('close')"
  >
    <template #header>{{ $t(title) }} - {{ tenantName }}</template>
    <p v-if="failed || error" role="alert">{{ error || $t('AbpUi::ErrorLoadingDatatable') }}</p>
    <form novalidate @submit.prevent="save">
      <fieldset :disabled="busy || !allowed">
        <AbpFormField
          v-for="field in fields"
          :key="field.name"
          :label="$t(field.label)"
          :errors="messages(form.get(field.name)?.errors ?? [])"
          required
        >
          <template #default="{ id, invalid, describedBy }">
            <AbpInput
              :id="id"
              v-model="form.controls[field.name].value"
              :name="field.name"
              :type="field.type"
              :revealable="field.type === 'password'"
              :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
              :title="field.name === 'username' ? $t('Saas::UserNameTooltip') : undefined"
              :invalid="invalid"
              :aria-describedby="describedBy"
            />
          </template>
        </AbpFormField>
        <AbpButton
          v-if="mode === 'password'"
          variant="secondary"
          :title="$t('AbpIdentity::GenerateRandomPasswordTooltip')"
          @click="generate"
          >{{ $t('AbpIdentity::GenerateRandomPassword') }}</AbpButton
        >
      </fieldset>
      <p v-for="message in form.unmatchedServerErrors" :key="message" role="alert">{{ message }}</p>
    </form>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
        $t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton :loading="busy" :disabled="!allowed" @click="save">{{
        $t('AbpUi::Save')
      }}</AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import {
  AuthError,
  AuthService,
  ConfigStateService,
  EnvironmentService,
  inject as injectAbp,
  WindowService,
  useLocalization,
} from '@lsw-abpvue/core';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import { TenantService } from '@lsw-abpvue/saas/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  generatePassword,
  passwordRulesOf,
  useAbpForm,
  useServerValidation,
  useToaster,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, ref, watch } from 'vue';
import type { TenantOperation } from '../tokens/pages.token.js';
import { canImpersonateTenant } from '../utils/tenant.js';
import { useSaasOperation } from '../utils/use-saas-operation.js';

const props = withDefaults(
  defineProps<{
    tenantId: string;
    tenantName?: string | undefined;
    mode?: TenantOperation | undefined;
  }>(),
  { mode: 'password', tenantName: '' },
);
const emit = defineEmits<{ close: []; saved: [] }>();
const tenants = injectAbp(TenantService);
const auth = injectAbp(AuthService);
const config = injectAbp(ConfigStateService);
const environment = injectAbp(EnvironmentService);
const windowService = injectAbp(WindowService);
const localization = useLocalization();
const toaster = useToaster();
const messages = useValidationMessages();
const policy = {
  password: SaasPolicyNames.TenantsSetPassword,
  invite: SaasPolicyNames.TenantsCreate,
  impersonate: SaasPolicyNames.TenantsImpersonation,
}[props.mode];
const operation = useSaasOperation(policy);
const { busy, failed, allowed } = operation;
const error = ref('');
const title = {
  password: 'Saas::SetPassword',
  invite: 'Saas::InviteUser',
  impersonate: 'Saas::LoginWithThisTenant',
}[props.mode];
const fields = computed(() =>
  props.mode === 'invite'
    ? [
        {
          name: 'email' as const,
          label: 'Saas::DisplayName:InviteAdminEmailAddress',
          type: 'email' as const,
        },
      ]
    : [
        { name: 'username' as const, label: 'Saas::UserName', type: 'text' as const },
        ...(props.mode === 'password'
          ? [{ name: 'password' as const, label: 'Saas::Password', type: 'password' as const }]
          : []),
      ],
);
const form = useAbpForm({
  username: { value: 'admin', validators: props.mode === 'invite' ? [] : [Validators.required()] },
  password: {
    value: '',
    validators: props.mode === 'password' ? [Validators.required()] : [],
  },
  email: {
    value: '',
    validators:
      props.mode === 'invite'
        ? [Validators.required(), Validators.email(), Validators.maxLength(256)]
        : [],
  },
});
useServerValidation(form);
watch([operation.context, allowed], () => emit('close'));
watch(
  () => props.tenantId,
  () => {
    operation.reset();
    form.reset();
    error.value = '';
  },
  { flush: 'sync' },
);

function generate() {
  if (busy.value || !allowed.value) return;
  try {
    form.controls.password.value = generatePassword(passwordRulesOf(config));
  } catch {
    error.value = localization.t('AbpValidation::ThisFieldIsNotValid.');
  }
}
async function save() {
  if (!form.validate() || !props.tenantId) return;
  error.value = '';
  await operation.run(
    async signal => {
      if (props.mode === 'invite')
        return tenants.inviteUser(props.tenantId, { email: form.value.email }, { signal });
      if (props.mode === 'password')
        return tenants.setPassword(
          props.tenantId,
          { username: form.value.username, password: form.value.password },
          { signal },
        );
      const fresh = await tenants.get(props.tenantId, { signal });
      if (
        signal.aborted ||
        !canImpersonateTenant(fresh, config, environment) ||
        !auth.loginUsingGrant
      )
        return false;
      try {
        await auth.loginUsingGrant(
          'Impersonation',
          { TenantId: props.tenantId, TenantUserName: form.value.username },
          {
            tenant: { id: props.tenantId, name: fresh.name ?? null, isAvailable: true },
            redirectUrl: '/',
            allowedTenantOrigins: windowService.nativeWindow
              ? [windowService.nativeWindow.location.origin]
              : [],
          },
        );
      } catch (failure) {
        error.value =
          failure instanceof AuthError && failure.errorDescription
            ? failure.errorDescription
            : localization.t('AbpAccount::Volo.Account:ImpersonateError');
        throw failure;
      }
    },
    result => {
      if (result === false) {
        error.value = localization.t('AbpAccount::Volo.Account:ImpersonateError');
        return;
      }
      toaster.success(
        props.mode === 'password'
          ? 'AbpIdentity::PasswordChangedMessage'
          : 'AbpUi::SavedSuccessfully',
      );
      emit('saved');
      emit('close');
    },
  );
}
</script>
