import { describe, expect, it } from 'vitest';
import { applySettingChanges } from './settings.js';

describe('account setting changes', () => {
  it('preserves concurrent values the operator did not edit', () => {
    expect(
      applySettingChanges(
        { enableLocalLogin: true, preventEmailEnumeration: true, isSelfRegistrationEnabled: true },
        { enableLocalLogin: true, preventEmailEnumeration: false, isSelfRegistrationEnabled: true },
        {
          enableLocalLogin: true,
          preventEmailEnumeration: false,
          isSelfRegistrationEnabled: false,
        },
      ),
    ).toEqual({
      enableLocalLogin: true,
      preventEmailEnumeration: true,
      isSelfRegistrationEnabled: false,
    });
  });
  it('matches providers and secret properties by name when the server reorders them', () => {
    const before = {
      externalProviders: [
        {
          name: 'Google',
          enabled: true,
          secretProperties: [{ name: 'ClientSecret', value: 'original' }],
        },
        { name: 'Microsoft', enabled: true },
      ],
    };
    const edited = structuredClone(before);
    const google = edited.externalProviders[0];
    if (google) google.enabled = false;
    const fresh = {
      externalProviders: [
        { name: 'Microsoft', enabled: false },
        {
          name: 'Google',
          enabled: true,
          secretProperties: [{ name: 'ClientSecret', value: 'concurrent' }],
        },
        { name: 'NewProvider', enabled: true },
      ],
    };
    expect(applySettingChanges(fresh, before, edited)).toEqual({
      externalProviders: [
        { name: 'Microsoft', enabled: false },
        {
          name: 'Google',
          enabled: false,
          secretProperties: [{ name: 'ClientSecret', value: 'concurrent' }],
        },
        { name: 'NewProvider', enabled: true },
      ],
    });
  });
  it('retains an explicit cleared secret and false value', () => {
    expect(
      applySettingChanges(
        { enabled: true, secret: 'fresh' },
        { enabled: true, secret: 'old' },
        { enabled: false, secret: '' },
      ),
    ).toEqual({ enabled: false, secret: '' });
  });
});
