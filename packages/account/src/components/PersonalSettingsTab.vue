<script setup lang="ts">
import { AccountComponents, useManageProfileState } from '@lsw-abpvue/account-core';
import { ProfileService, type UpdateProfileDto } from '@lsw-abpvue/account-core/proxy';
import {
  AbpExtensibleForm,
  EXTENSIONS_IDENTIFIER,
  useExtensibleForm,
} from '@lsw-abpvue/components';
import {
  AuthService,
  ConfigStateService,
  inject as injectAbp,
  provideAbp,
  runInInjectionContext,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import { ACCOUNT_RE_LOGIN_CONFIRMATION } from '../tokens/config-options.token.js';

const profiles = injectAbp(ProfileService);
const configState = injectAbp(ConfigStateService);
const auth = injectAbp(AuthService, { optional: true });
const askAgain = injectAbp(ACCOUNT_RE_LOGIN_CONFIRMATION);
const state = useManageProfileState();
const confirmation = useConfirmation();
const toaster = useToaster();

const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: AccountComponents.PersonalSettings },
]);

const profile = state.profile.value ?? undefined;
const form = runInInjectionContext(injector, () => useExtensibleForm(profile));
const busy = ref(false);
const editing = shallowRef(profile);

useServerValidation(form.form);

/** What the session was issued for: changing either of these makes the token stale. */
function identityChanged(next: UpdateProfileDto): boolean {
  return next.userName !== profile?.userName || next.email !== profile?.email;
}

async function submit(): Promise<void> {
  if (!form.form.validate()) return;

  const body = form.toRequestBody() as UpdateProfileDto;
  busy.value = true;

  try {
    const saved = await profiles.update(body);
    state.set(saved);
    editing.value = saved;
    await configState.refreshAppState();
    toaster.success('AbpAccount::PersonalSettingsSaved', undefined, { life: 5000 });

    if (!askAgain || !identityChanged(body) || !auth) return;

    const answer = await confirmation.info(
      'AbpAccount::PersonalSettingsChangedConfirmationModalDescription',
      'AbpAccount::PersonalSettingsChangedConfirmationModalTitle',
    );
    if (answer === ConfirmationStatus.confirm) await auth.logout();
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <h2 class="h5 mb-3">{{ $t('AbpIdentity::PersonalSettings') }}</h2>

  <form novalidate @submit.prevent="submit">
    <AbpExtensibleForm :form="form" :record="editing" />

    <AbpButton type="submit" variant="primary" :loading="busy">
      {{ $t('AbpUi::Save') }}
    </AbpButton>
  </form>
</template>
