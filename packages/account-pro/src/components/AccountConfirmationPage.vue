<template>
  <div>
    <p v-if="failed" role="alert">{{ $t('AbpUi::ValidationErrorMessage') }}</p>
    <AbpButton v-if="failed" :disabled="busy" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    <template v-if="mode === 'email-confirmation'">
      <p v-if="done" role="status">
        {{ $t('AbpAccount::YourEmailAddressIsSuccessfullyConfirmed') }}
      </p>
      <RouterLink :to="loginRoute">{{ $t('AbpAccount::Login') }}</RouterLink>
    </template>
    <template v-else-if="mode === 'confirm-user'">
      <h1 class="h4">{{ $t('AbpAccount::ConfirmUser') }}</h1>
      <section v-if="requireEmail && !confirmationState?.emailConfirmed">
        <h2 class="h5">{{ $t('AbpIdentity::DisplayName:Email') }}</h2>
        <p>{{ flow.challenge.value?.email }}</p>
        <AbpButton :disabled="busy || emailSent" @click="sendEmail">{{
          $t('AbpAccount::Verify')
        }}</AbpButton>
        <p v-if="emailSent" role="status">
          {{ $t('AbpAccount::EmailConfirmationSentMessage', flow.challenge.value?.email ?? '') }}
        </p>
      </section>
      <section v-if="requirePhone && !confirmationState?.phoneNumberConfirmed">
        <h2 class="h5">{{ $t('AbpIdentity::DisplayName:PhoneNumber') }}</h2>
        <AbpFormField v-slot="field" :label="$t('AbpIdentity::DisplayName:PhoneNumber')" required
          ><AbpInput
            :id="field.id"
            v-model="phone"
            type="tel"
            name="phoneNumber"
            autocomplete="tel"
        /></AbpFormField>
        <AbpButton :disabled="busy || !phone.trim()" @click="sendPhone">{{
          $t('AbpAccount::Verify')
        }}</AbpButton>
        <form v-if="phoneSent" @submit.prevent="confirmPhone">
          <AbpFormField v-slot="field" :label="$t('AbpAccount::PhoneConfirmationToken')" required
            ><AbpInput
              :id="field.id"
              v-model="code"
              name="phoneConfirmationToken"
              autocomplete="one-time-code"
              required
          /></AbpFormField>
          <AbpButton type="submit" :disabled="busy || !code.trim()">{{
            $t('AbpAccount::Verify')
          }}</AbpButton>
        </form>
      </section>
      <AbpButton variant="secondary" class="mt-3" :disabled="busy" @click="load">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
      <RouterLink class="ms-3" :to="loginRoute">{{ $t('AbpAccount::BackToLogin') }}</RouterLink>
    </template>
    <div v-else-if="linked" class="d-grid gap-3">
      <AbpButton :disabled="busy" @click="stay">{{
        $t('AbpAccount::StayWithCurrentAccount')
      }}</AbpButton>
      <AbpButton variant="secondary" :disabled="busy || needsReload" @click="returnToPrevious">{{
        $t('AbpAccount::ReturnToPreviousAccount', linked.targetUserName ?? '')
      }}</AbpButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ACCOUNT_PRO_OPTIONS } from '@lsw-abpvue/account-pro/config';
import {
  AccountService,
  IdentityLinkUserService,
  type IdentityUserConfirmationStateDto,
  type LinkUserDto,
} from '@lsw-abpvue/account-pro/proxy';
import { ConfigStateService, inject as injectAbp } from '@lsw-abpvue/core';
import { AbpButton, AbpFormField, AbpInput } from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { AccountAuthFlowService } from '../services/auth-flow.service.js';
import { AccountWorkflowsService } from '../services/account-workflows.service.js';
import { useAccountOperation } from '../utils/use-account-operation.js';
import { ACCOUNT_PRO_CONFIG_OPTIONS } from '../tokens/config-options.token.js';

const props = defineProps<{ mode: 'email-confirmation' | 'confirm-user' | 'link-logged' }>();
const mode = props.mode;
const account = injectAbp(AccountService);
const links = injectAbp(IdentityLinkUserService);
const workflows = injectAbp(AccountWorkflowsService);
const flow = injectAbp(AccountAuthFlowService);
const config = injectAbp(ConfigStateService);
const options = { ...injectAbp(ACCOUNT_PRO_OPTIONS), ...injectAbp(ACCOUNT_PRO_CONFIG_OPTIONS) };
const route = useRoute();
const router = useRouter();
const { busy, failed, needsReload, run, invalidate } = useAccountOperation();
const done = ref(false);
const linked = shallowRef<LinkUserDto>();
const confirmationState = shallowRef<IdentityUserConfirmationStateDto>();
const phone = ref(flow.challenge.value?.phoneNumber ?? '');
const code = ref('');
const emailSent = ref(false);
const phoneSent = ref(false);
let poll: ReturnType<typeof setInterval> | undefined;
const requireEmail = computed(
  () =>
    config.snapshot().setting.values['Abp.Identity.SignIn.RequireConfirmedEmail']?.toLowerCase() ===
    'true',
);
const requirePhone = computed(
  () =>
    config
      .snapshot()
      .setting.values['Abp.Identity.SignIn.RequireConfirmedPhoneNumber']?.toLowerCase() === 'true',
);
function query(name: string): string {
  const value = route.query[name];
  return typeof value === 'string' ? value : '';
}
const loginRoute = computed(() => ({
  path: '/account/login',
  query: { returnUrl: query('returnUrl') || undefined },
}));
function requestConfig(signal: AbortSignal) {
  return { signal, skipAuthorization: true, headers: { __tenant: query('__tenant') } };
}
async function readConfirmation(): Promise<void> {
  const userId = flow.challenge.value?.userId;
  if (!userId) {
    await router.replace(loginRoute.value);
    return;
  }
  await run(
    signal => account.getConfirmationState(userId, { signal, skipAuthorization: true }),
    value => {
      confirmationState.value = value;
      if (
        (!requireEmail.value || value.emailConfirmed) &&
        (!requirePhone.value || value.phoneNumberConfirmed)
      )
        void router.replace(loginRoute.value);
    },
  );
}
async function load(): Promise<void> {
  if (mode === 'confirm-user') return readConfirmation();
  if (mode === 'link-logged') {
    await run(
      signal => links.getAllList({ signal }),
      value => {
        linked.value = value.items.find(
          item =>
            item.targetUserId === query('linkUserId') &&
            (item.targetTenantId ?? '') === query('linkTenantId'),
        );
        if (!linked.value) void router.replace(loginRoute.value);
      },
    );
    return;
  }
  const userId = query('userId');
  const token = query('confirmationToken');
  if (!userId || !token) {
    failed.value = true;
    return;
  }
  const newEmailAddress = query('newEmailAddress');
  let usable = false;
  const verified = await run(
    signal =>
      newEmailAddress
        ? account.verifyChangeEmailToken({ userId, newEmailAddress, token }, requestConfig(signal))
        : account.verifyEmailConfirmationToken({ userId, token }, requestConfig(signal)),
    valid => {
      usable = valid;
      failed.value = !valid;
    },
  );
  if (!verified || !usable) return;
  await run(
    signal =>
      newEmailAddress
        ? account.changeEmail({ userId, newEmailAddress, token }, requestConfig(signal))
        : account.confirmEmail({ userId, token }, requestConfig(signal)),
    () => {
      done.value = true;
      const next = { ...route.query };
      delete next.confirmationToken;
      void router.replace({ query: next, hash: route.hash });
    },
    true,
  );
}
async function sendEmail(): Promise<void> {
  const userId = flow.challenge.value?.userId;
  if (!userId) return;
  if (
    (await run(
      signal =>
        account.sendEmailConfirmationToken(
          { userId, appName: options.appName ?? 'Vue' },
          { signal, skipAuthorization: true },
        ),
      () => {
        emailSent.value = true;
      },
      true,
    )) &&
    !poll
  )
    poll = setInterval(() => {
      void readConfirmation();
    }, 3000);
}
async function sendPhone(): Promise<void> {
  const userId = flow.challenge.value?.userId;
  if (!userId || !phone.value.trim()) return;
  await run(
    signal =>
      account.sendPhoneNumberConfirmationToken(
        { userId, phoneNumber: phone.value },
        { signal, skipAuthorization: true },
      ),
    () => {
      phoneSent.value = true;
    },
    true,
  );
}
async function confirmPhone(): Promise<void> {
  const userId = flow.challenge.value?.userId;
  if (!userId || !code.value.trim()) return;
  if (
    await run(
      signal =>
        account.confirmPhoneNumber(
          { userId, token: code.value },
          { signal, skipAuthorization: true },
        ),
      () => {
        code.value = '';
      },
      true,
    )
  )
    await readConfirmation();
}
function stay(): void {
  const path = query('returnUrl');
  void router.push(
    path.startsWith('/') &&
      !path.startsWith('//') &&
      !path.includes('\\') &&
      [...path].every(character => character.charCodeAt(0) >= 32)
      ? path
      : '/',
  );
}
async function returnToPrevious(): Promise<void> {
  const record = linked.value;
  if (record)
    await run(
      () => workflows.loginAs(record),
      () => {},
      true,
    );
}
watch(
  () => route.fullPath,
  () => {
    if (mode === 'email-confirmation' && !query('confirmationToken') && done.value) return;
    invalidate();
    done.value = false;
    void load();
  },
  { immediate: true },
);
onBeforeRouteLeave(() => {
  if (mode === 'confirm-user') flow.clear();
});
onScopeDispose(() => {
  code.value = '';
  if (poll) clearInterval(poll);
});
</script>
