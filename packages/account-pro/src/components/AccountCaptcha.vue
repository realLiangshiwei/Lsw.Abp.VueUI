<template>
  <div v-if="enabled" class="abp-account-captcha">
    <div ref="container" />
    <p v-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton v-if="failed" variant="secondary" @click="initialize">{{
      $t('AbpUi::Refresh')
    }}</AbpButton>
  </div>
</template>
<script setup lang="ts">
import {
  ConfigStateService,
  DocumentService,
  inject as injectAbp,
  WindowService,
} from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from 'vue';

interface RecaptchaClient {
  ready(callback: () => void): void;
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      callback(token: string): void;
      'expired-callback'(): void;
      'error-callback'(): void;
    },
  ): number;
  reset(widget?: number): void;
  execute(key: string, options: { action: string }): Promise<string>;
}
class CaptchaUnavailableError extends Error {
  constructor() {
    super('CAPTCHA verification is unavailable. Reload the challenge and try again.');
    this.name = 'CaptchaUnavailableError';
  }
}
const props = defineProps<{ action: 'login' | 'register' | 'forgot-password' }>();
const config = injectAbp(ConfigStateService);
const browser = injectAbp(WindowService).nativeWindow as
  (Window & { grecaptcha?: RecaptchaClient }) | undefined;
const document = injectAbp(DocumentService).nativeDocument;
const container = ref<HTMLDivElement>();
const failed = ref(false);
const token = ref('');
const ready = ref(false);
let widget: number | undefined;
let disposed = false;
const enabled = computed(() => {
  const page =
    props.action === 'login'
      ? 'Login'
      : props.action === 'register'
        ? 'Registration'
        : 'ForgotPassword';
  return (
    config.snapshot().setting.values[`Abp.Account.Captcha.UseCaptchaOn${page}`]?.toLowerCase() ===
    'true'
  );
});
function setting(name: string): string {
  return config.snapshot().setting.values[`Abp.Account.Captcha.${name}`] ?? '';
}
async function initialize(): Promise<void> {
  if (!enabled.value || !browser || !document || !container.value) return;
  failed.value = false;
  ready.value = false;
  token.value = '';
  try {
    if (!browser.grecaptcha) {
      const url = new URL(
        'recaptcha/api.js',
        setting('VerifyBaseUrl') || 'https://www.google.com/',
      );
      url.searchParams.set('render', setting('Version') === '2' ? 'explicit' : setting('SiteKey'));
      url.searchParams.set('hl', config.snapshot().localization.currentCulture.cultureName ?? 'en');
      const script = document.createElement('script');
      script.src = url.href;
      script.async = true;
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => {
          script.remove();
          reject(new CaptchaUnavailableError());
        };
        document.head.append(script);
      });
    }
    if (disposed) return;
    const client = browser.grecaptcha;
    if (!client) throw new CaptchaUnavailableError();
    await new Promise<void>(resolve => client.ready(resolve));
    if (disposed) return;
    if (setting('Version') === '2') {
      if (widget !== undefined) client.reset(widget);
      else
        widget = client.render(container.value, {
          sitekey: setting('SiteKey'),
          callback: value => {
            token.value = value;
          },
          'expired-callback': () => {
            token.value = '';
          },
          'error-callback': () => {
            token.value = '';
            failed.value = true;
          },
        });
    }
    ready.value = true;
  } catch {
    // CAPTCHA must fail closed when the provider cannot be loaded.
    if (!disposed) failed.value = true;
  }
}
async function getToken(): Promise<string | undefined> {
  if (!enabled.value) return undefined;
  if (!ready.value || !browser?.grecaptcha) throw new CaptchaUnavailableError();
  const value =
    setting('Version') === '2'
      ? token.value
      : await browser.grecaptcha.execute(setting('SiteKey'), { action: props.action });
  if (!value) throw new CaptchaUnavailableError();
  return value;
}
function reset(): void {
  token.value = '';
  if (widget !== undefined) browser?.grecaptcha?.reset(widget);
}
defineExpose({ getToken, reset });
watch(enabled, async value => {
  reset();
  if (value) {
    await nextTick();
    await initialize();
  }
});
onMounted(initialize);
onScopeDispose(() => {
  disposed = true;
  reset();
});
</script>
