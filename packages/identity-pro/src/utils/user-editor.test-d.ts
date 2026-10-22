import type { ExtensibleForm } from '@lsw-abpvue/components';
import type { IdentityUserDto as BaseIdentityUserDto } from '@lsw-abpvue/identity/proxy';
import type {
  IdentityUserCreateDto,
  IdentityUserDto,
  IdentityUserUpdateDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  getIdentityUserFormChanges,
  serializeIdentityUserCreate,
  serializeIdentityUserUpdate,
  IdentityUserCreateSnapshot,
  IdentityUserEditSnapshot,
  IdentityUserEditorSnapshot,
} from './user-editor.js';

describe('commercial user editor types', () => {
  it('uses the commercial user throughout its snapshot and form boundary', () => {
    expectTypeOf<IdentityUserEditSnapshot['user']>().toEqualTypeOf<IdentityUserDto>();
    expectTypeOf<IdentityUserEditSnapshot['user']>().not.toMatchTypeOf<BaseIdentityUserDto>();
    expectTypeOf<Parameters<typeof getIdentityUserFormChanges>[0]>().toEqualTypeOf<
      ExtensibleForm<IdentityUserDto>
    >();
  });

  it('requires a narrowed complete snapshot for the matching create or update request', () => {
    expectTypeOf<
      Parameters<typeof serializeIdentityUserCreate>[0]
    >().toEqualTypeOf<IdentityUserCreateSnapshot>();
    expectTypeOf<
      Parameters<typeof serializeIdentityUserUpdate>[0]
    >().toEqualTypeOf<IdentityUserEditSnapshot>();
    expectTypeOf<IdentityUserEditorSnapshot>().toEqualTypeOf<
      IdentityUserCreateSnapshot | IdentityUserEditSnapshot
    >();
    expectTypeOf<
      ReturnType<typeof serializeIdentityUserCreate>
    >().toEqualTypeOf<IdentityUserCreateDto>();
    expectTypeOf<
      ReturnType<typeof serializeIdentityUserUpdate>
    >().toEqualTypeOf<IdentityUserUpdateDto>();
    expectTypeOf<IdentityUserUpdateDto>().not.toHaveProperty('password');
  });
});
