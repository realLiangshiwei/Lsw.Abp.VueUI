import { passwordValidators, type PasswordRules } from '@lsw-abpvue/theme-shared';
import { describe, expect, it, vi } from 'vitest';
import { generateIdentityPassword, PasswordGenerationError } from './generate-password.js';
const baseline: PasswordRules = {
  requiredLength: 6,
  requiredUniqueChars: 1,
  requireDigit: true,
  requireLowercase: true,
  requireUppercase: true,
  requireNonAlphanumeric: true,
};
describe('generated Identity passwords', () => {
  it.each([
    [6, 1],
    [32, 32],
    [128, 128],
    [128, 1],
  ])(
    'satisfies runtime length %i and unique characters %i using secure randomness',
    (requiredLength, requiredUniqueChars) => {
      const rules = { ...baseline, requiredLength, requiredUniqueChars };
      const secureRandom = vi.spyOn(globalThis.crypto, 'getRandomValues');
      const value = generateIdentityPassword(rules);
      expect(value.length).toBeLessThanOrEqual(128);
      expect(
        passwordValidators(rules).every(
          validate => validate(value, { valueOf: () => undefined }) === null,
        ),
      ).toBe(true);
      expect(secureRandom).toHaveBeenCalled();
      secureRandom.mockRestore();
      expect(generateIdentityPassword(rules)).not.toBe(value);
    },
  );
  it('reports an impossible policy without silently truncating its requirements', () => {
    expect(() => generateIdentityPassword({ ...baseline, requiredLength: 129 })).toThrow(
      PasswordGenerationError,
    );
  });
});
