import type {
  AccountSettingsDto,
  AccountTwoFactorSettingsDto,
  AccountRecaptchaSettingsDto,
  AccountExternalProviderSettingsDto,
  AccountIdleSettingsDto,
  AccountPasskeySettingsDto,
  AccountEmailLoginSettingsDto,
} from '@lsw-abpvue/account-pro/proxy';

export type {
  AccountSettingsDto,
  AccountTwoFactorSettingsDto,
  AccountRecaptchaSettingsDto,
  AccountExternalProviderSettingsDto,
  ExternalProviderSettings,
  ExternalProviderSettingsProperty,
  AccountIdleSettingsDto,
  AccountPasskeySettingsDto,
  AccountEmailLoginSettingsDto,
} from '@lsw-abpvue/account-pro/proxy';

export interface AccountAdminSettings {
  general: AccountSettingsDto;
  twoFactor: AccountTwoFactorSettingsDto;
  captcha: AccountRecaptchaSettingsDto;
  external: AccountExternalProviderSettingsDto;
  idle: AccountIdleSettingsDto;
  passkey: AccountPasskeySettingsDto;
  emailLogin: AccountEmailLoginSettingsDto;
}

export type AccountSettingSection = keyof AccountAdminSettings;
