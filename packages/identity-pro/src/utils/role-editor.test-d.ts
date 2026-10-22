import { expectTypeOf } from 'vitest';
import type {
  IdentityRoleCreateDto,
  IdentityRoleDto,
  IdentityRoleUpdateDto,
} from '@lsw-abpvue/identity-pro/proxy';
import {
  serializeIdentityRoleCreate,
  serializeIdentityRoleUpdate,
  type IdentityRoleFormChanges,
} from './role-editor.js';

declare const changes: IdentityRoleFormChanges;
declare const role: IdentityRoleDto;
expectTypeOf(serializeIdentityRoleCreate(changes)).toEqualTypeOf<IdentityRoleCreateDto>();
expectTypeOf(serializeIdentityRoleUpdate(role, changes)).toEqualTypeOf<IdentityRoleUpdateDto>();
