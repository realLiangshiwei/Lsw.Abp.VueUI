import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { IdentityProComponents as IdentityComponents } from './enums/components.js';
import type {
  IdentityRoleDto as BaseRole,
  IdentityUserDto as BaseUser,
} from '@lsw-abpvue/identity/proxy';
import type {
  ClaimTypeDto,
  IdentityRoleDto,
  IdentityUserDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type { IdentityProConfigOptions } from './models/config-options.js';
import type { IdentityProUsersPageCommands } from './tokens/users-page.token.js';

type Users = typeof IdentityComponents.Users;
type Roles = typeof IdentityComponents.Roles;
type Item<T> = NonNullable<T> extends readonly (infer Element)[] ? Element : never;

describe('commercial contributor contracts', () => {
  it('exposes find, export and import as page commands without a selected record or caller query', () => {
    expectTypeOf<IdentityProUsersPageCommands['findUser']>().toEqualTypeOf<() => void>();
    expectTypeOf<IdentityProUsersPageCommands['exportUsers']>().toEqualTypeOf<() => void>();
    expectTypeOf<IdentityProUsersPageCommands['importUsers']>().toEqualTypeOf<() => void>();
  });

  it('keeps all five user callbacks on the commercial DTO', () => {
    type Options = IdentityProConfigOptions;
    expectTypeOf<Item<NonNullable<Options['entityPropContributors']>[Users]>>().toEqualTypeOf<
      EntityPropContributorCallback<IdentityUserDto>
    >();
    expectTypeOf<Item<NonNullable<Options['createFormPropContributors']>[Users]>>().toEqualTypeOf<
      FormPropContributorCallback<IdentityUserDto>
    >();
    expectTypeOf<Item<NonNullable<Options['editFormPropContributors']>[Users]>>().toEqualTypeOf<
      FormPropContributorCallback<IdentityUserDto>
    >();
    expectTypeOf<Item<NonNullable<Options['entityActionContributors']>[Users]>>().toEqualTypeOf<
      EntityActionContributorCallback<IdentityUserDto>
    >();
    expectTypeOf<Item<NonNullable<Options['toolbarActionContributors']>[Users]>>().toEqualTypeOf<
      ToolbarActionContributorCallback<readonly IdentityUserDto[]>
    >();
    expectTypeOf<IdentityUserDto>().not.toEqualTypeOf<BaseUser>();
  });

  it('keeps roles and claim types on their commercial DTOs', () => {
    expectTypeOf<
      Item<NonNullable<IdentityProConfigOptions['entityPropContributors']>[Roles]>
    >().toEqualTypeOf<EntityPropContributorCallback<IdentityRoleDto>>();
    expectTypeOf<IdentityRoleDto>().not.toEqualTypeOf<BaseRole>();
    expectTypeOf<
      Item<NonNullable<IdentityProConfigOptions['createFormPropContributors']>[Roles]>
    >().toEqualTypeOf<FormPropContributorCallback<IdentityRoleDto>>();
    expectTypeOf<
      Item<NonNullable<IdentityProConfigOptions['editFormPropContributors']>[Roles]>
    >().toEqualTypeOf<FormPropContributorCallback<IdentityRoleDto>>();
    expectTypeOf<
      Item<NonNullable<IdentityProConfigOptions['entityActionContributors']>[Roles]>
    >().toEqualTypeOf<EntityActionContributorCallback<IdentityRoleDto>>();
    expectTypeOf<
      Item<NonNullable<IdentityProConfigOptions['toolbarActionContributors']>[Roles]>
    >().toEqualTypeOf<ToolbarActionContributorCallback<readonly IdentityRoleDto[]>>();
    expectTypeOf<
      Item<
        NonNullable<
          IdentityProConfigOptions['createFormPropContributors']
        >[typeof IdentityComponents.Claims]
      >
    >().toEqualTypeOf<FormPropContributorCallback<ClaimTypeDto>>();
    expectTypeOf<
      Item<
        NonNullable<
          IdentityProConfigOptions['editFormPropContributors']
        >[typeof IdentityComponents.Claims]
      >
    >().toEqualTypeOf<FormPropContributorCallback<ClaimTypeDto>>();
    expectTypeOf<
      Item<
        NonNullable<
          IdentityProConfigOptions['entityActionContributors']
        >[typeof IdentityComponents.Claims]
      >
    >().toEqualTypeOf<EntityActionContributorCallback<ClaimTypeDto>>();
    expectTypeOf<
      Item<
        NonNullable<
          IdentityProConfigOptions['toolbarActionContributors']
        >[typeof IdentityComponents.Claims]
      >
    >().toEqualTypeOf<ToolbarActionContributorCallback<readonly ClaimTypeDto[]>>();
    expectTypeOf<
      Item<
        NonNullable<
          IdentityProConfigOptions['entityPropContributors']
        >[typeof IdentityComponents.Claims]
      >
    >().toEqualTypeOf<EntityPropContributorCallback<ClaimTypeDto>>();
    expectTypeOf<
      Parameters<IdentityProUsersPageCommands['edit']>[0]
    >().toEqualTypeOf<IdentityUserDto>();
    expectTypeOf<
      Parameters<IdentityProUsersPageCommands['viewDetails']>[0]
    >().toEqualTypeOf<IdentityUserDto>();
    expectTypeOf<
      Parameters<IdentityProUsersPageCommands['lock']>[0]
    >().toEqualTypeOf<IdentityUserDto>();
  });
});
