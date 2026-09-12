import { describe, expectTypeOf, it } from 'vitest';
import { createInjector } from '../di/injector.js';
import { PermissionService } from '../services/permission.service.js';
import type { AbpPolicyName, UnknownPolicyName } from './policy.js';

const permission = createInjector([]).get(PermissionService);

describe('a policy name while no module has declared any', () => {
  it('is any string, so an application that merges nothing keeps compiling', () => {
    expectTypeOf<AbpPolicyName<'AbpIdentity.Users'>>().toEqualTypeOf<'AbpIdentity.Users'>();
    expectTypeOf<AbpPolicyName<'anything at all'>>().toEqualTypeOf<'anything at all'>();
    expectTypeOf<AbpPolicyName<string>>().toEqualTypeOf<string>();
  });

  it('is what isGranted takes, literal or not', () => {
    const fromRouteData: string | undefined = 'AbpIdentity.Users';

    expectTypeOf(permission.isGranted('AbpIdentity.Users')).toEqualTypeOf<boolean>();
    expectTypeOf(permission.isGranted('A || B')).toEqualTypeOf<boolean>();
    expectTypeOf(permission.isGranted(fromRouteData)).toEqualTypeOf<boolean>();
    expectTypeOf(permission.isGranted(undefined)).toEqualTypeOf<boolean>();
    expectTypeOf(permission.isGrantedRef(() => fromRouteData).value).toEqualTypeOf<boolean>();
  });
});

describe('a policy name once a module has declared some', () => {
  interface Declared {
    'AbpIdentity.Users': true;
    'AbpIdentity.Users.Create': true;
  }

  // What `AbpPolicyName` resolves to, with the merged interface written out: the
  // interface itself cannot be merged into here without narrowing every other test in
  // this package. The merge is checked where it is meant to happen, in a consumer --
  // `scripts/check-external-install.sh` and the playground.
  type Narrowed<T extends string> = string extends T
    ? T
    : T extends keyof Declared | `${string}||${string}` | `${string}&&${string}`
      ? T
      : UnknownPolicyName<T>;

  it('accepts a declared name', () => {
    expectTypeOf<Narrowed<'AbpIdentity.Users'>>().toEqualTypeOf<'AbpIdentity.Users'>();
  });

  it('accepts an expression of them, which is not narrowed further', () => {
    expectTypeOf<
      Narrowed<'AbpIdentity.Users || AbpIdentity.Roles'>
    >().toEqualTypeOf<'AbpIdentity.Users || AbpIdentity.Roles'>();
  });

  it('still accepts a plain string, such as a route policy read at runtime', () => {
    expectTypeOf<Narrowed<string>>().toEqualTypeOf<string>();
  });

  it('rejects a name no module declares', () => {
    expectTypeOf<Narrowed<'AbpIdentity.Userz'>>().toEqualTypeOf<
      UnknownPolicyName<'AbpIdentity.Userz'>
    >();
    expectTypeOf<'AbpIdentity.Userz'>().not.toExtend<Narrowed<'AbpIdentity.Userz'>>();
  });
});
