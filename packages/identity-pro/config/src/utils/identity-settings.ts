import type {
  IdentityLdapSettingsDto,
  IdentityOAuthSettingsDto,
  IdentitySettingsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import type { IdentitySettingsGroup } from '../models/identity-settings.js';

const groupFields = {
  password: [
    'requiredLength',
    'requiredUniqueChars',
    'requireNonAlphanumeric',
    'requireLowercase',
    'requireUppercase',
    'requireDigit',
    'forceUsersToPeriodicallyChangePassword',
    'passwordChangePeriodDays',
    'enablePreventPasswordReuse',
    'preventPasswordReuseCount',
  ],
  lockout: ['allowedForNewUsers', 'lockoutDuration', 'maxFailedAccessAttempts'],
  signIn: [
    'requireConfirmedEmail',
    'enablePhoneNumberConfirmation',
    'requireConfirmedPhoneNumber',
    'requireEmailVerificationToRegister',
  ],
  user: ['isUserNameUpdateEnabled', 'isEmailUpdateEnabled'],
} as const;

export class IdentitySettingsStateError extends Error {
  constructor() {
    super('The identity settings are incomplete. Reload the settings before saving.');
    this.name = 'IdentitySettingsStateError';
  }
}

function copyGroup(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new IdentitySettingsStateError();
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    fields.filter(name => Object.hasOwn(source, name)).map(name => [name, source[name]]),
  );
}

export function mergeIdentitySettingsGroup(
  fresh: IdentitySettingsDto,
  group: IdentitySettingsGroup,
  changes: Record<string, unknown>,
): IdentitySettingsDto {
  return Object.fromEntries(
    Object.entries(groupFields).map(([name, fields]) => [
      name,
      {
        ...copyGroup(fresh[name as IdentitySettingsGroup], fields),
        ...(name === group ? copyGroup(changes, fields) : {}),
      },
    ]),
  );
}

export function serializeIdentityLdapSettings(
  current: IdentityLdapSettingsDto,
  changes: Record<string, unknown>,
): IdentityLdapSettingsDto {
  const fields = [
    'enableLdapLogin',
    'ldaps',
    'ldapServerHost',
    'ldapServerPort',
    'ldapBaseDc',
    'ldapDomain',
    'ldapUserName',
  ];
  const result = { ...copyGroup(current, fields), ...copyGroup(changes, fields) };
  if (typeof changes.ldapPassword === 'string' && changes.ldapPassword.length > 0)
    result.ldapPassword = changes.ldapPassword;
  return result;
}

export function serializeIdentityOAuthSettings(
  current: IdentityOAuthSettingsDto,
  changes: Record<string, unknown>,
): IdentityOAuthSettingsDto {
  const fields = [
    'enableOAuthLogin',
    'clientId',
    'authority',
    'scope',
    'requireHttpsMetadata',
    'validateEndpoints',
    'validateIssuerName',
  ];
  const result = { ...copyGroup(current, fields), ...copyGroup(changes, fields) };
  if (typeof result.clientId !== 'string' || typeof result.authority !== 'string')
    throw new IdentitySettingsStateError();
  if (changes.clearClientSecret === true) result.clientSecret = '';
  else if (typeof changes.clientSecret === 'string' && changes.clientSecret.length > 0)
    result.clientSecret = changes.clientSecret;
  else if (typeof current.clientSecret === 'string') result.clientSecret = current.clientSecret;
  return result as unknown as IdentityOAuthSettingsDto;
}
