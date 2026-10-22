import type { IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  IdentityUserDetailsLoader,
  IdentityUserDetailsSnapshot,
} from '../models/user-details.js';

describe('commercial user details types', () => {
  it('keeps the commercial record and explicitly models an absent audit lookup', () => {
    expectTypeOf<IdentityUserDetailsSnapshot['user']>().toEqualTypeOf<IdentityUserDto>();
    expectTypeOf<IdentityUserDetailsSnapshot['creator']>().toEqualTypeOf<
      IdentityUserDto | undefined
    >();
    expectTypeOf<IdentityUserDetailsSnapshot['modifier']>().toEqualTypeOf<
      IdentityUserDto | undefined
    >();
  });

  it('returns a complete read-only snapshot or an obsolete cancelled result', () => {
    expectTypeOf<ReturnType<IdentityUserDetailsLoader['load']>>().toEqualTypeOf<
      Promise<IdentityUserDetailsSnapshot | undefined>
    >();
    expectTypeOf<IdentityUserDetailsLoader>().not.toHaveProperty('save');
  });
});
