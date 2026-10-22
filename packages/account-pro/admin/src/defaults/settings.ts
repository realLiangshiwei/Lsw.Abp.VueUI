import type { AccountSettingSection } from '../models/settings.js';

export interface AccountSettingField {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'number' | 'choice' | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  choices?: readonly { value: string; label: string }[] | undefined;
}

export const accountSettingGroups: {
  name: AccountSettingSection;
  label: string;
  fields: AccountSettingField[];
}[] = [
  {
    name: 'general',
    label: 'AbpAccount::AccountSettingsGeneral',
    fields: [
      {
        key: 'isSelfRegistrationEnabled',
        label: 'AbpAccount::DisplayName:IsSelfRegistrationEnabled',
      },
      { key: 'enableLocalLogin', label: 'AbpAccount::DisplayName:EnableLocalLogin' },
      { key: 'preventEmailEnumeration', label: 'AbpAccount::DisplayName:PreventEmailEnumeration' },
    ],
  },
  {
    name: 'twoFactor',
    label: 'AbpAccount::AccountSettingsTwoFactor',
    fields: [
      {
        key: 'twoFactorBehaviour',
        label: 'AbpIdentity::DisplayName:Abp.Identity.TwoFactorBehaviour',
        type: 'choice',
        choices: [
          {
            value: '0',
            label: 'Optional',
          },
          {
            value: '1',
            label: 'Disabled',
          },
          { value: '2', label: 'Forced' },
        ],
      },
      { key: 'isRememberBrowserEnabled', label: 'AbpAccount::RememberBrowser' },
      {
        key: 'usersCanChange',
        label: 'AbpIdentity::DisplayName:Abp.Identity.UsersCanChange',
      },
    ],
  },
  {
    name: 'captcha',
    label: 'AbpAccount::Captcha',
    fields: [
      { key: 'useCaptchaOnLogin', label: 'AbpAccount::Description:UseCaptchaOnLogin' },
      {
        key: 'useCaptchaOnRegistration',
        label: 'AbpAccount::Description:UseCaptchaOnRegistration',
      },
      {
        key: 'useCaptchaOnForgotPassword',
        label: 'AbpAccount::Description:UseCaptchaOnForgotPassword',
      },
      { key: 'verifyBaseUrl', label: 'AbpAccount::DisplayName:VerificationUrl', type: 'text' },
      { key: 'siteKey', label: 'AbpAccount::DisplayName:SiteKey', type: 'text' },
      { key: 'siteSecret', label: 'AbpAccount::DisplayName:SiteSecret', type: 'password' },
      {
        key: 'version',
        label: 'AbpAccount::DisplayName:Version',
        type: 'choice',
        choices: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
        ],
      },
      {
        key: 'score',
        label: 'AbpAccount::DisplayName:Score',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  {
    name: 'external',
    label: 'AbpAccount::AccountExternalProviderSettings',
    fields: [
      {
        key: 'verifyPasswordDuringExternalLogin',
        label: 'AbpAccount::DisplayName:VerifyPasswordDuringExternalLogin',
      },
    ],
  },
  {
    name: 'idle',
    label: 'AbpAccount::IdleSessionTimeout',
    fields: [
      { key: 'enabled', label: 'AbpAccount::IdleSignOutInactiveUserAutomatically' },
      {
        key: 'idleTimeoutMinutes',
        label: 'AbpAccount::IdleTimeoutMinutes',
        type: 'number',
        min: 1,
        step: 1,
      },
      {
        key: 'countdownSeconds',
        label: 'AbpAccount::IdleCountdownSeconds',
        type: 'number',
        min: 1,
        step: 1,
      },
    ],
  },
  {
    name: 'passkey',
    label: 'AbpAccount::Passkey',
    fields: [
      { key: 'enabled', label: 'AbpAccount::EnablePasskey' },
      {
        key: 'maximumPasskeysPerUser',
        label: 'AbpAccount::MaximumPasskeysPerUser',
        type: 'number',
        min: 1,
        step: 1,
      },
    ],
  },
];
