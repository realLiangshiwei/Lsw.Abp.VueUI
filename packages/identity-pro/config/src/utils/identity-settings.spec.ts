import { describe, expect, it } from 'vitest';
import type { IdentitySettingsDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  mergeIdentitySettingsGroup,
  serializeIdentityLdapSettings,
  serializeIdentityOAuthSettings,
} from './identity-settings.js';
const settings: IdentitySettingsDto = {
  password: { requiredLength: 12 },
  lockout: { lockoutDuration: 15 },
  signIn: { requireConfirmedEmail: true },
  user: { isEmailUpdateEnabled: false },
};
describe('identity settings serializers', () => {
  it('clears the OAuth secret only when explicitly requested', () => {
    expect(
      serializeIdentityOAuthSettings(
        { clientId: 'client', authority: 'https://issuer.test', clientSecret: 'current' },
        { clearClientSecret: true },
      ),
    ).toEqual({ clientId: 'client', authority: 'https://issuer.test', clientSecret: '' });
  });

  it('changes only the selected known fields and retains the other fresh settings groups', () => {
    expect(
      mergeIdentitySettingsGroup(settings, 'password', {
        requiredLength: 18,
        unknownField: 'discard',
        lockout: {},
      }),
    ).toEqual({ ...settings, password: { requiredLength: 18 } });
    expect(settings.password?.requiredLength).toBe(12);
  });
  it('retains unmodified settings within the selected group', () => {
    expect(
      mergeIdentitySettingsGroup(
        { ...settings, password: { requiredLength: 12, requireDigit: true } },
        'password',
        { requiredLength: 15 },
      ).password,
    ).toEqual({ requiredLength: 15, requireDigit: true });
  });
  it('rejects incomplete fresh settings instead of replacing absent groups', () => {
    expect(() => mergeIdentitySettingsGroup({ password: {} }, 'password', {})).toThrow(
      'incomplete',
    );
  });
  it('does not submit a secret read from LDAP when the administrator did not replace it', () => {
    expect(
      serializeIdentityLdapSettings(
        { ldapPassword: 'hidden', ldapServerHost: 'old' },
        { ldapServerHost: 'new' },
      ),
    ).toEqual({ ldapServerHost: 'new' });
  });
  it('submits a nonempty explicit LDAP password without trimming it', () => {
    expect(
      serializeIdentityLdapSettings({}, { ldapPassword: ' new value ', unknown: true }),
    ).toEqual({ ldapPassword: ' new value ' });
  });
  it('does not turn an empty LDAP password field into an explicit credential replacement', () => {
    expect(serializeIdentityLdapSettings({}, { ldapPassword: '' })).toEqual({});
  });
  it('preserves the fresh OAuth secret required by the replacement endpoint', () => {
    expect(
      serializeIdentityOAuthSettings(
        { clientId: 'client', authority: 'https://issuer.test', clientSecret: 'hidden' },
        { scope: 'openid' },
      ),
    ).toEqual({
      clientId: 'client',
      authority: 'https://issuer.test',
      scope: 'openid',
      clientSecret: 'hidden',
    });
  });
  it('submits an explicit OAuth secret and drops unrelated properties', () => {
    expect(
      serializeIdentityOAuthSettings(
        { clientId: 'client', authority: 'https://issuer.test' },
        { clientSecret: 'new secret', unrelated: true },
      ),
    ).toEqual({ clientId: 'client', authority: 'https://issuer.test', clientSecret: 'new secret' });
  });
  it('rejects an OAuth snapshot with missing required identity information', () => {
    expect(() => serializeIdentityOAuthSettings({} as never, {})).toThrow('incomplete');
  });
});
