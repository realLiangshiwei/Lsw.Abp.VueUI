import type { LocalizationWithDefault } from '@lsw-abpvue/core';

/**
 * Texts ABP's own resources have no key for. Written as keys with the English as the
 * fallback: nothing breaks on a backend that has never heard of them, and the day one
 * does they are translated for free.
 */
export const AUTHENTICATOR_CODE: LocalizationWithDefault = {
  key: 'AbpAccount::AuthenticatorCode',
  defaultValue: 'Authenticator code',
};

export const TWO_FACTOR_TEXTS = {
  provider: { key: 'AbpAccount::TwoFactorProvider', defaultValue: 'Verification method' },
  code: { key: 'AbpAccount::VerificationCode', defaultValue: 'Verification code' },
  send: { key: 'AbpAccount::SendVerificationCode', defaultValue: 'Send code' },
  resend: { key: 'AbpAccount::ResendVerificationCode', defaultValue: 'Resend code' },
  sent: {
    key: 'AbpAccount::VerificationCodeSent',
    defaultValue: 'A verification code has been sent.',
  },
  back: { key: 'AbpAccount::BackToLogin', defaultValue: 'Back to sign in' },
  required: {
    key: 'AbpAccount::VerificationCodeRequired',
    defaultValue: 'Enter the verification code.',
  },
  unavailable: {
    key: 'AbpAccount::TwoFactorUnavailable',
    defaultValue: 'No verification method is available. Contact your administrator.',
  },
} satisfies Record<string, LocalizationWithDefault>;
