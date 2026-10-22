import type { IdentityUserDto, IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { expectTypeOf, test } from 'vitest';
import type { IdentityUserFindInput, IdentityUserFindMode } from '../models/user-find.js';
import { createIdentityUserFindLoader } from './user-find.js';

test('administrative search accepts all three exact modes and returns a commercial user', () => {
  expectTypeOf<IdentityUserFindMode>().toEqualTypeOf<'id' | 'userName' | 'email'>();
  expectTypeOf<IdentityUserFindInput>().toEqualTypeOf<{
    readonly mode: IdentityUserFindMode;
    readonly value: string;
  }>();
  const api = {} as IdentityUserService;
  const loader = createIdentityUserFindLoader(api);
  expectTypeOf(loader.find({ mode: 'userName', value: 'raw+%text' })).toEqualTypeOf<
    Promise<IdentityUserDto | undefined>
  >();
  // @ts-expect-error Administrative lookup does not accept the generic user lookup mode.
  void loader.find({ mode: 'lookup', value: 'user' });
  // @ts-expect-error The state is owned by the loader.
  loader.state.value = { status: 'idle' };
});
