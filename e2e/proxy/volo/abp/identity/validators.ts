// What the backend already declares about its own values, as validators a form can
// spread into its controls. Two sources: the data annotations on a DTO property, and
// the attributes on an object extension property.
//
// The maps are sparse on purpose. A rule the backend enforces in code rather than in an
// attribute is not here, and a form still says whatever else it needs to say.

import { Validators } from '@lsw-abpvue/theme-shared';
import type { ValidatorMap } from '@lsw-abpvue/theme-shared';
import type {
  IdentityRoleCreateOrUpdateDtoBase,
  IdentityUserCreateDto,
  IdentityUserCreateOrUpdateDtoBase,
  IdentityUserUpdateDto,
  IdentityUserUpdateRolesDto,
} from './models.js';

export const identityRoleCreateOrUpdateDtoBaseValidators = {
  name: [Validators.required(), Validators.maxLength(256)],
} satisfies ValidatorMap<IdentityRoleCreateOrUpdateDtoBase>;

export const identityUserCreateDtoValidators = {
  password: [Validators.required(), Validators.maxLength(128)],
} satisfies ValidatorMap<IdentityUserCreateDto>;

export const identityUserCreateOrUpdateDtoBaseValidators = {
  userName: [Validators.required(), Validators.maxLength(256)],
  name: [Validators.maxLength(64)],
  surname: [Validators.maxLength(64)],
  email: [Validators.required(), Validators.maxLength(256)],
  phoneNumber: [Validators.maxLength(16)],
} satisfies ValidatorMap<IdentityUserCreateOrUpdateDtoBase>;

export const identityUserUpdateDtoValidators = {
  password: [Validators.maxLength(128)],
} satisfies ValidatorMap<IdentityUserUpdateDto>;

export const identityUserUpdateRolesDtoValidators = {
  roleNames: [Validators.required()],
} satisfies ValidatorMap<IdentityUserUpdateRolesDto>;
