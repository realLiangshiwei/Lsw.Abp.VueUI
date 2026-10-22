import type { IdentitySettingsField, IdentitySettingsTab } from '../models/identity-settings.js';

const passwordLabel = (name: string) => `AbpIdentity::DisplayName:Abp.Identity.Password.${name}`;
export const IDENTITY_SETTINGS_FIELDS: Record<
  Exclude<IdentitySettingsTab, 'session'>,
  readonly IdentitySettingsField[]
> = {
  password: [
    {
      name: 'requiredLength',
      label: passwordLabel('RequiredLength'),
      type: 'number',
      min: 2,
      max: 128,
      required: true,
    },
    {
      name: 'requiredUniqueChars',
      label: passwordLabel('RequiredUniqueChars'),
      type: 'number',
      min: 1,
      max: 128,
      required: true,
    },
    ...[
      'RequireNonAlphanumeric',
      'RequireLowercase',
      'RequireUppercase',
      'RequireDigit',
      'ForceUsersToPeriodicallyChangePassword',
    ].map(name => ({
      name: name[0]?.toLowerCase() + name.slice(1),
      label: passwordLabel(name),
      type: 'boolean' as const,
    })),
    {
      name: 'passwordChangePeriodDays',
      label: passwordLabel('PasswordChangePeriodDays'),
      type: 'number',
      min: 0,
      required: true,
    },
    {
      name: 'enablePreventPasswordReuse',
      label: passwordLabel('EnablePreventPasswordReuse'),
      type: 'boolean',
    },
    {
      name: 'preventPasswordReuseCount',
      label: passwordLabel('PreventPasswordReuseCount'),
      type: 'number',
      min: 1,
      max: 128,
      required: true,
    },
  ],
  lockout: [
    {
      name: 'allowedForNewUsers',
      label: 'AbpIdentity::DisplayName:Abp.Identity.Lockout.AllowedForNewUsers',
      type: 'boolean',
    },
    {
      name: 'lockoutDuration',
      label: 'AbpIdentity::DisplayName:Abp.Identity.Lockout.LockoutDuration',
      type: 'number',
      min: 0,
      required: true,
    },
    {
      name: 'maxFailedAccessAttempts',
      label: 'AbpIdentity::DisplayName:Abp.Identity.Lockout.MaxFailedAccessAttempts',
      type: 'number',
      min: 1,
      required: true,
    },
  ],
  signIn: [
    'RequireConfirmedEmail',
    'EnablePhoneNumberConfirmation',
    'RequireConfirmedPhoneNumber',
    'RequireEmailVerificationToRegister',
  ].map(name => ({
    name: name[0]?.toLowerCase() + name.slice(1),
    label: `AbpIdentity::DisplayName:Abp.Identity.SignIn.${name}`,
    type: 'boolean',
  })),
  user: ['IsUserNameUpdateEnabled', 'IsEmailUpdateEnabled'].map(name => ({
    name: name[0]?.toLowerCase() + name.slice(1),
    label: `AbpIdentity::DisplayName:Abp.Identity.User.${name}`,
    type: 'boolean',
  })),
  ldap: [
    {
      name: 'enableLdapLogin',
      label: 'AbpIdentity::DisplayName:Abp.Identity.EnableLdapLogin',
      type: 'boolean',
    },
    { name: 'ldaps', label: 'AbpLdap::DisplayName:Abp.Ldap.Ldaps', type: 'boolean' },
    ...['ServerHost', 'ServerPort', 'BaseDc', 'Domain', 'UserName'].map(name => ({
      name: `ldap${name}`,
      label: `AbpLdap::DisplayName:Abp.Ldap.${name}`,
      type: 'text' as const,
    })),
    { name: 'ldapPassword', label: 'AbpLdap::DisplayName:Abp.Ldap.Password', type: 'password' },
  ],
  oauth: [
    {
      name: 'enableOAuthLogin',
      label: 'AbpIdentity::DisplayName:Abp.Identity.EnableOAuthLogin',
      type: 'boolean',
    },
    ...['ClientId', 'ClientSecret', 'Authority', 'Scope'].map(name => ({
      name: name[0]?.toLowerCase() + name.slice(1),
      label: `AbpIdentity::DisplayName:Abp.Identity.${name}`,
      type: name === 'ClientSecret' ? ('password' as const) : ('text' as const),
      required: name === 'ClientId' || name === 'Authority',
    })),
    ...['RequireHttpsMetadata', 'ValidateIssuerName', 'ValidateEndpoints'].map(name => ({
      name: name[0]?.toLowerCase() + name.slice(1),
      label: `AbpIdentity::DisplayName:Abp.Identity.${name}`,
      type: 'boolean' as const,
    })),
  ],
};
