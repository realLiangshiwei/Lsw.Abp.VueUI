<template>
  <AbpModal
    :visible="true"
    :busy="busy"
    :dirty="activeForm.dirty"
    @update:visible="$event || emit('close')"
  >
    <template #header>{{ localization.t(title) }}: {{ user.userName }}</template>

    <AbpSpinner v-if="loading" />
    <p v-if="recoveryMessage" role="alert">{{ recoveryMessage }}</p>
    <AbpButton
      v-if="readFailed || uncertain"
      variant="secondary"
      :disabled="busy || loading"
      @click="load(true)"
      >{{ localization.t('AbpUi::Refresh') }}</AbpButton
    >

    <form v-if="!loading" novalidate @submit.prevent="save">
      <p v-if="operation === 'unlock'">
        {{ localization.t('AbpIdentity::ThisUserIsLockedOutMessage') }}
      </p>

      <template v-if="operation === 'lock'">
        <p v-if="details && !details.lockoutEnabled" role="alert">
          {{ localization.t('AbpIdentity::UserLockoutNotEnabled{0}', user.userName) }}
        </p>
        <p v-else-if="details && isUserLockedOut(details)" role="alert">
          {{ localization.t('AbpIdentity::ThisUserIsLockedOutMessage') }}
        </p>
        <AbpFormField
          :label="localization.t('AbpIdentity::DisplayName:LockoutEnd')"
          :errors="lockErrors"
          required
        >
          <template #default="{ id, describedBy, invalid }">
            <AbpDatePicker
              :id="id"
              v-model="lockForm.controls.lockoutEnd.value"
              type="datetime"
              name="lockoutEnd"
              :min="minimumLockoutEnd"
              :disabled="busy || !canSave"
              :invalid="invalid"
              :aria-describedby="describedBy"
            />
          </template>
        </AbpFormField>
      </template>

      <template v-if="operation === 'password'">
        <AbpButton variant="secondary" :disabled="busy || !canSave" @click="generatePassword">{{
          localization.t('AbpIdentity::GenerateRandomPassword')
        }}</AbpButton>
        <AbpFormField
          :label="localization.t('AbpIdentity::DisplayName:NewPassword')"
          :errors="passwordErrors"
          required
        >
          <template #default="{ id, describedBy, invalid }">
            <AbpInput
              :id="id"
              v-model="passwordForm.controls.newPassword.value"
              name="newPassword"
              type="password"
              autocomplete="new-password"
              revealable
              :disabled="busy || !canSave"
              :invalid="invalid"
              :aria-describedby="describedBy"
              @blur="passwordForm.controls.newPassword.markAsTouched()"
            />
          </template>
        </AbpFormField>

        <AbpFormField
          :label="localization.t('AbpIdentity::DisplayName:NewPasswordConfirm')"
          :errors="confirmationErrors"
          required
        >
          <template #default="{ id, describedBy, invalid }">
            <AbpInput
              :id="id"
              v-model="passwordForm.controls.newPasswordConfirm.value"
              name="newPasswordConfirm"
              type="password"
              autocomplete="new-password"
              revealable
              :disabled="busy || !canSave"
              :invalid="invalid"
              :aria-describedby="describedBy"
              @blur="passwordForm.controls.newPasswordConfirm.markAsTouched()"
            />
          </template>
        </AbpFormField>
      </template>

      <template v-if="operation === 'two-factor'">
        <p v-if="twoFactorUnavailable" role="alert">
          {{ localization.t('AbpIdentity::YouCanNotEnableTwoFactorForThisUser') }}
        </p>
        <AbpToggle
          v-model="twoFactorForm.controls.enabled.value"
          name="twoFactorEnabled"
          :label="localization.t('AbpIdentity::DisplayName:TwoFactorEnabled')"
          :disabled="
            busy || !mayUpdate || (twoFactorUnavailable && !twoFactorForm.controls.enabled.value)
          "
        />
      </template>

      <p v-for="error in activeForm.unmatchedServerErrors" :key="error" role="alert">
        {{ error }}
      </p>
    </form>

    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton
        v-if="mayUpdate"
        variant="primary"
        :loading="busy"
        :disabled="loading || !canSave"
        @click="save"
      >
        {{ localization.t('AbpUi::Save') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import {
  AbpHttpError,
  ConfigStateService,
  HttpErrorReporterService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityPolicyNames } from '@lsw-abpvue/identity/config';
import {
  IdentityUserService,
  type IdentityUserDto as IdentityProUserDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSpinner,
  AbpToggle,
  useAbpForm,
  passwordValidators,
  passwordRulesOf,
  useServerValidation,
  useToaster,
  useValidationMessages,
  VALIDATION_MESSAGES,
  Validators,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import type { UserSecurityOperation } from '../models/user-security.js';
import { generateIdentityPassword } from '../utils/generate-password.js';
import {
  canManageHostLevelUserOperations,
  canManageUserTwoFactor,
  canLockUser,
  canUnlockUser,
  isUserLockedOut,
} from '../utils/user-operation-policy.js';

const props = defineProps<{ operation: UserSecurityOperation; user: IdentityProUserDto }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const users = injectAbp(IdentityUserService);
const config = injectAbp(ConfigStateService);
const errorReporter = injectAbp(HttpErrorReporterService);
const localization = useLocalization();
const permission = usePermission();
const toaster = useToaster();
const messages = useValidationMessages();
const details = shallowRef<IdentityProUserDto>();
const loading = ref(false);
const busy = ref(false);
const minimumLockoutEnd = ref(localDateTime());
const originalTwoFactorEnabled = ref(false);
const contextKey = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
  ]),
);
const loadedContext = ref('');
const readFailed = ref(false);
const uncertain = ref(false);
const recoveryMessage = ref('');

const lockForm = useAbpForm({
  lockoutEnd: { value: '', validators: [Validators.required()] },
});
const passwordForm = useAbpForm({
  newPassword: {
    value: '',
    validators: [
      Validators.required(),
      Validators.maxLength(128),
      (value, context) => {
        for (const validate of passwordValidators(passwordRulesOf(config))) {
          const error = validate(value, context);
          if (error) return error;
        }
        return null;
      },
    ],
  },
  newPasswordConfirm: {
    value: '',
    validators: [
      Validators.required(),
      Validators.compare('newPassword', 'AbpIdentity::PasswordsAreNotSame'),
    ],
  },
});
const twoFactorForm = useAbpForm({ enabled: { value: false } });
const activeForm = computed(() =>
  props.operation === 'password'
    ? passwordForm
    : props.operation === 'lock'
      ? lockForm
      : twoFactorForm,
);

useServerValidation({ setServerErrors: errors => activeForm.value.setServerErrors(errors) });

const lockErrors = computed(() =>
  lockForm.controls.lockoutEnd.touched ? messages(lockForm.controls.lockoutEnd.errors) : [],
);
const passwordErrors = computed(() =>
  passwordForm.controls.newPassword.touched
    ? messages(passwordForm.controls.newPassword.errors)
    : [],
);
const confirmationErrors = computed(() =>
  passwordForm.controls.newPasswordConfirm.touched
    ? messages(passwordForm.controls.newPasswordConfirm.errors)
    : [],
);
const title = computed(
  () =>
    ({
      lock: 'AbpIdentity::Lock',
      unlock: 'AbpIdentity::Unlock',
      password: 'AbpIdentity::SetPassword',
      'two-factor': 'AbpIdentity::TwoFactor',
    })[props.operation],
);
const mayUpdate = computed(
  () =>
    permission.isGranted(IdentityPolicyNames.UsersUpdate) &&
    (props.operation === 'two-factor'
      ? canManageUserTwoFactor(config.snapshot())
      : props.operation === 'lock' || props.operation === 'unlock'
        ? canManageHostLevelUserOperations(config.snapshot())
        : true),
);
const twoFactorUnavailable = computed(() => details.value?.supportTwoFactor === false);
const canSave = computed(() => {
  if (
    !details.value ||
    readFailed.value ||
    uncertain.value ||
    !mayUpdate.value ||
    loadedContext.value !== contextKey.value
  )
    return false;
  if (props.operation === 'password') return true;
  if (props.operation === 'two-factor') {
    return (
      twoFactorForm.controls.enabled.value !== originalTwoFactorEnabled.value &&
      (!twoFactorUnavailable.value || !twoFactorForm.controls.enabled.value)
    );
  }
  if (props.operation === 'lock') {
    return canLockUser(details.value, config.snapshot());
  }
  return canUnlockUser(details.value, config.snapshot());
});

let revision = 0;
let pending: AbortController | undefined;

function localDateTime(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, -1);
}

async function load(preserve: boolean): Promise<void> {
  const id = props.user.id;
  const operation = props.operation;
  const own = ++revision;
  const contextAtRead = contextKey.value;
  pending?.abort();
  pending = new AbortController();
  const signal = pending.signal;
  details.value = undefined;
  loading.value = true;
  busy.value = false;
  readFailed.value = false;
  recoveryMessage.value = '';
  minimumLockoutEnd.value = localDateTime();
  if (!preserve) {
    lockForm.reset({ lockoutEnd: '' });
    passwordForm.reset({ newPassword: '', newPasswordConfirm: '' });
    twoFactorForm.reset({ enabled: false });
  }

  try {
    if (!id) return;
    const [user, enabled] = await Promise.all([
      users.get(id, { signal, skipHandleError: true }),
      operation === 'two-factor'
        ? users.getTwoFactorEnabled(id, { signal, skipHandleError: true })
        : Promise.resolve(false),
    ]);
    if (own !== revision || contextAtRead !== contextKey.value) return;
    if (user.id !== id) {
      readFailed.value = true;
      recoveryMessage.value = localization.t('AbpUi::ErrorLoadingDatatable');
      return;
    }

    loadedContext.value = contextAtRead;
    details.value = user;
    originalTwoFactorEnabled.value = enabled;
    if (!preserve) twoFactorForm.reset({ enabled });
    uncertain.value = false;
  } catch (error) {
    if (own === revision && !signal.aborted) {
      readFailed.value = true;
      recoveryMessage.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
    if (own === revision && !signal.aborted && error instanceof AbpHttpError) {
      errorReporter.reportError(error);
    }
  } finally {
    if (own === revision) loading.value = false;
  }
}
watch(
  () => [props.user.id, props.operation] as const,
  () => load(false),
  { immediate: true },
);

function generatePassword(): void {
  if (!canSave.value || busy.value) return;
  try {
    const generated = generateIdentityPassword(passwordRulesOf(config));
    passwordForm.controls.newPassword.value = generated;
    passwordForm.controls.newPasswordConfirm.value = generated;
  } catch {
    recoveryMessage.value = localization.t('AbpValidation::ThisFieldIsNotValid.');
  }
}

onBeforeUnmount(() => {
  revision += 1;
  pending?.abort();
});
watch(
  contextKey,
  () => {
    revision += 1;
    pending?.abort();
    emit('close');
  },
  { flush: 'sync' },
);
watch(
  mayUpdate,
  allowed => {
    if (!allowed) {
      revision += 1;
      pending?.abort();
    }
  },
  { flush: 'sync' },
);

async function save(): Promise<void> {
  const id = details.value?.id;
  if (busy.value || loading.value || !id || !canSave.value || !activeForm.value.validate()) return;

  if (props.operation === 'lock') {
    const end = Date.parse(lockForm.value.lockoutEnd);
    if (!Number.isFinite(end) || end <= Date.now()) {
      lockForm.controls.lockoutEnd.setServerErrors([
        localization.t(VALIDATION_MESSAGES.min, localDateTime()),
      ]);
      return;
    }
  }

  const own = revision;
  const operation = props.operation;
  busy.value = true;

  try {
    if (operation === 'lock') {
      await users.lock(id, new Date(lockForm.value.lockoutEnd).toISOString());
    } else if (operation === 'unlock') {
      await users.unlock(id);
    } else if (operation === 'password') {
      await users.updatePassword(id, { newPassword: passwordForm.value.newPassword });
    } else {
      await users.setTwoFactorEnabled(id, twoFactorForm.value.enabled);
    }

    if (own !== revision) return;
    toaster.success(
      operation === 'unlock' ? 'AbpIdentity::UserUnlocked' : 'AbpUi::SavedSuccessfully',
    );
    emit('saved');
    emit('close');
  } catch {
    if (own === revision) {
      uncertain.value = true;
      recoveryMessage.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
  } finally {
    if (own === revision) busy.value = false;
  }
}
</script>
