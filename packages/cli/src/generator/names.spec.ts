import { describe, expect, it } from 'vitest';
import {
  camelCase,
  isIdentifier,
  kebabCase,
  namespaceToDirectory,
  quoteName,
  relativeNamespacePath,
} from './names.js';

describe('camelCase', () => {
  it.each([
    ['UserName', 'userName'],
    ['Name', 'name'],
    ['TenantId', 'tenantId'],
    ['ID', 'id'],
    ['IPAddress', 'ipAddress'],
    ['id', 'id'],
    ['', ''],
  ])('%s becomes %s', (input, expected) => {
    expect(camelCase(input)).toBe(expected);
  });
});

describe('kebabCase', () => {
  it.each([
    ['IdentityUser', 'identity-user'],
    ['AbpApplicationConfiguration', 'abp-application-configuration'],
    ['IdentitySecurityLogType', 'identity-security-log-type'],
    ['UI', 'ui'],
    ['multi-tenancy', 'multi-tenancy'],
  ])('%s becomes %s', (input, expected) => {
    expect(kebabCase(input)).toBe(expected);
  });
});

describe('namespaceToDirectory', () => {
  it('is one directory per namespace segment', () => {
    expect(namespaceToDirectory('Volo.Abp.Identity')).toBe('volo/abp/identity');
    expect(namespaceToDirectory('')).toBe('');
  });
});

describe('relativeNamespacePath', () => {
  it('is a dot within one namespace', () => {
    expect(relativeNamespacePath('Volo.Abp.Identity', 'Volo.Abp.Identity')).toBe('.');
  });

  it('walks up to the shared part and back down', () => {
    expect(relativeNamespacePath('Volo.Abp.Identity', 'Volo.Abp.Users')).toBe('../users');
    expect(relativeNamespacePath('Volo.Abp.Identity', 'Volo.Abp')).toBe('..');
    expect(relativeNamespacePath('Volo.Abp', 'Volo.Abp.Identity')).toBe('./identity');
  });

  it('leaves the root namespace addressable from anywhere', () => {
    expect(relativeNamespacePath('Volo.Abp.Identity', '')).toBe('../../..');
    expect(relativeNamespacePath('', 'Volo.Abp')).toBe('./volo/abp');
  });
});

describe('quoteName', () => {
  it('quotes what cannot be written bare', () => {
    expect(quoteName('userName')).toBe('userName');
    expect(quoteName('api-version')).toBe("'api-version'");
    expect(quoteName('class')).toBe("'class'");
    expect(isIdentifier('2fa')).toBe(false);
  });
});
