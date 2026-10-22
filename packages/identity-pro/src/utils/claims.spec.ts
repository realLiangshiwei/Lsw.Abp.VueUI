import type { ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it } from 'vitest';
import {
  createIdentityClaimsPayload,
  getIdentityClaimValueError,
  getIdentityClaimValueType,
  hasIdentityClaim,
} from './claims.js';

describe('commercial claim values', () => {
  it.each(['', ' ', '\t\n'])('requires a nonblank value: %j', value => {
    expect(getIdentityClaimValueError(value)).toBe('required');
  });
  it.each(['false', '0', '  preserved  ', '<b>plain text</b>'])(
    'retains a nonempty string: %j',
    value => {
      expect(getIdentityClaimValueError(value)).toBeUndefined();
    },
  );
  it('tests the configured expression without trimming the submitted value', () => {
    expect(getIdentityClaimValueError('ABC', { regex: '^[A-Z]+$' })).toBeUndefined();
    expect(getIdentityClaimValueError(' ABC ', { regex: '^[A-Z]+$' })).toBe('regex');
  });
  it('contains malformed expressions in validation instead of throwing during rendering', () => {
    expect(getIdentityClaimValueError('value', { regex: '[' })).toBe('invalid-regex');
  });
  it.each([0, 1, 2, 3] as const)('chooses the advertised value type %s', valueType => {
    expect(getIdentityClaimValueType({ valueType } as ClaimTypeDto)).toBe(valueType);
  });
  it.each([
    ['Int', 1],
    ['Boolean', 2],
    ['DateTime', 3],
    ['future', 0],
  ] as const)('supports the %s textual type fallback', (valueTypeAsString, expected) => {
    expect(
      getIdentityClaimValueType({ valueType: 99, valueTypeAsString } as unknown as ClaimTypeDto),
    ).toBe(expected);
  });
  it('defaults an unknown existing claim to a text editor', () => {
    expect(getIdentityClaimValueType()).toBe(0);
  });
  it('compares the exact type and value pair without case folding or trimming', () => {
    const claims = [{ claimType: 'team', claimValue: 'A' }];
    expect(hasIdentityClaim(claims, 'team', 'A')).toBe(true);
    expect(hasIdentityClaim(claims, 'team', 'a')).toBe(false);
    expect(hasIdentityClaim(claims, 'Team', 'A')).toBe(false);
    expect(hasIdentityClaim(claims, 'team', ' A')).toBe(false);
  });
  it.each(['user', 'role'] as const)(
    'replaces all %s claims while retaining unknown values and excluding blank rows',
    provider => {
      const claims = [
        { claimType: 'unknown', claimValue: '  retained  ', userId: 'old', roleId: 'old' },
        { claimType: 'empty', claimValue: ' ' },
        { claimType: 'unset' },
        { claimType: 'boolean', claimValue: 'false' },
      ];
      const result = createIdentityClaimsPayload({ provider, entityId: 'current' }, claims);
      const key = provider === 'user' ? 'userId' : 'roleId';
      expect(result).toEqual([
        { [key]: 'current', claimType: 'unknown', claimValue: '  retained  ' },
        { [key]: 'current', claimType: 'boolean', claimValue: 'false' },
      ]);
      expect(claims[0]?.userId).toBe('old');
    },
  );
  it('sends an intentional empty replacement when every row is removed', () => {
    expect(createIdentityClaimsPayload({ provider: 'role', entityId: 'id' }, [])).toEqual([]);
  });
});
