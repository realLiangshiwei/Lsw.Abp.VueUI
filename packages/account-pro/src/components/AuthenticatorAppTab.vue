<template>
  <div>
    <h2 class="h5">{{ $t('AbpAccount::AuthenticatorApp') }}</h2>
    <p v-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton v-if="failed" :disabled="busy" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    <template v-if="loaded && !codes.length">
      <template v-if="hasAuthenticator">
        <p>{{ $t('AbpAccount::Verified') }}</p>
        <p>{{ $t('AbpAccount::ResetAuthenticator_Information') }}</p>
        <AbpButton variant="danger" :disabled="busy || needsReload" @click="reset">{{
          $t('AbpAccount::ResetAuthenticator')
        }}</AbpButton>
      </template>
      <template v-else>
        <p>{{ $t('AbpAccount::UseTwoFactorAuthenticatorApp_Information') }}</p>
        <img v-if="qr" :src="qr" :alt="$t('AbpAccount::UseQrCode')" width="240" height="240" />
        <p>{{ $t('AbpAccount::ManuallyEnterCode') }}</p>
        <code dir="ltr">{{ info?.key }}</code>
        <AbpButton
          :disabled="!browser.nativeWindow?.navigator.clipboard"
          @click="copy(info?.key ?? '')"
          >{{ $t('AbpAccount::CopyToClipboard') }}</AbpButton
        >
        <form class="mt-3" @submit.prevent="verify">
          <AbpFormField v-slot="field" :label="$t('AbpAccount::Code')" required
            ><AbpInput
              :id="field.id"
              v-model="code"
              name="authenticatorCode"
              autocomplete="one-time-code"
              inputmode="numeric"
              required
          /></AbpFormField>
          <AbpButton type="submit" :disabled="busy || needsReload || !code.trim()">{{
            $t('AbpAccount::Verify')
          }}</AbpButton>
        </form>
      </template>
    </template>
    <section v-if="codes.length">
      <h3 class="h5">{{ $t('AbpAccount::RecoveryCodes') }}</h3>
      <p>{{ $t('AbpAccount::RecoveryCodes_Information') }}</p>
      <ul dir="ltr">
        <li v-for="value in codes" :key="value">
          <code>{{ value }}</code>
        </li>
      </ul>
      <div class="d-flex flex-wrap gap-2">
        <AbpButton
          :disabled="!browser.nativeWindow?.navigator.clipboard"
          @click="copy(codes.join('\n'))"
          >{{ $t('AbpAccount::CopyToClipboard') }}</AbpButton
        >
        <AbpButton :disabled="!browser.nativeWindow" @click="browser.nativeWindow?.print()">{{
          $t('AbpAccount::PrintCodes')
        }}</AbpButton>
        <AbpButton @click="codes = []">{{ $t('AbpAccount::Done') }}</AbpButton>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { AccountService, type AuthenticatorInfoDto } from '@lsw-abpvue/account-pro/proxy';
import { ConfigStateService, inject as injectAbp, WindowService } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  ConfirmationStatus,
  useConfirmation,
} from '@lsw-abpvue/theme-shared';
import { onMounted, onScopeDispose, ref, shallowRef } from 'vue';
import QRCode from 'qrcode';
import { useAccountOperation } from '../utils/use-account-operation.js';

const service = injectAbp(AccountService);
const config = injectAbp(ConfigStateService);
const browser = injectAbp(WindowService);
const confirmation = useConfirmation();
const { busy, failed, needsReload, run } = useAccountOperation();
const loaded = ref(false);
const hasAuthenticator = ref(false);
const info = shallowRef<AuthenticatorInfoDto>();
const qr = ref('');
const code = ref('');
const codes = ref<string[]>([]);
function load(): Promise<boolean> {
  return run(
    async signal => {
      const enabled = await service.hasAuthenticator({ signal });
      const value = enabled ? undefined : await service.getAuthenticatorInfo({ signal });
      const image = value?.uri ? await QRCode.toDataURL(value.uri, { width: 240, margin: 2 }) : '';
      return { enabled, value, image };
    },
    ({ enabled, value, image }) => {
      hasAuthenticator.value = enabled;
      info.value = value;
      qr.value = image;
      loaded.value = true;
      code.value = '';
    },
  );
}
async function verify(): Promise<void> {
  if (!code.value.trim()) return;
  await run(
    signal =>
      service.verifyAuthenticatorCode({ code: code.value.trim().replace(/\s/g, '') }, { signal }),
    value => {
      codes.value = value.recoveryCodes ?? [];
      hasAuthenticator.value = true;
      info.value = undefined;
      qr.value = '';
      code.value = '';
    },
    true,
  );
}
async function reset(): Promise<void> {
  const subject = `${config.snapshot().currentTenant.id}:${config.snapshot().currentUser.id}`;
  if (
    (await confirmation.warn(
      'AbpAccount::ResetAuthenticatorWarningMessage',
      'AbpUi::AreYouSure',
    )) !== ConfirmationStatus.confirm ||
    subject !== `${config.snapshot().currentTenant.id}:${config.snapshot().currentUser.id}`
  )
    return;
  if (
    await run(
      signal => service.resetAuthenticator({ signal }),
      () => {
        codes.value = [];
      },
      true,
    )
  )
    await load();
}
async function copy(value: string): Promise<void> {
  await run(async () => {
    const clipboard = browser.nativeWindow?.navigator.clipboard;
    if (clipboard) await clipboard.writeText(value);
  });
}
onMounted(load);
onScopeDispose(() => {
  codes.value = [];
  code.value = '';
  info.value = undefined;
  qr.value = '';
});
</script>
