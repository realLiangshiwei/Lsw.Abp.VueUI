export type IdentitySettingsGroup = 'password' | 'lockout' | 'signIn' | 'user';
export type IdentitySettingsTab = IdentitySettingsGroup | 'session' | 'ldap' | 'oauth';
export type IdentitySettingsScalar = string | number | boolean | undefined;
export interface IdentitySettingsField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'boolean';
  min?: number | undefined;
  max?: number | undefined;
  required?: boolean | undefined;
}
