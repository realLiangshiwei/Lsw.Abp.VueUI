// What the backend already declares about its own values, as validators a form can
// spread into its controls. Two sources: the data annotations on a DTO property, and
// the attributes on an object extension property.
//
// The maps are sparse on purpose. A rule the backend enforces in code rather than in an
// attribute is not here, and a form still says whatever else it needs to say. A rule a
// DTO inherits stays in the map of the type that declares it, so a form that edits a
// derived DTO spreads the two together.
//
// Keyed by the property name the backend declared, which is the name the extensible
// form gives the control. The values live in `extraProperties`, not on the DTO.

import { Validators } from '@lsw-abpvue/theme-shared';
import type { ValidatorMap } from '@lsw-abpvue/theme-shared';

export const identityUserExtensionValidators = {
  SocialSecurityNumber: [Validators.required(), Validators.maxLength(64), Validators.minLength(4)],
  Age: [Validators.required(), Validators.range(0, 150)],
  IsExternal: [Validators.required()],
  Title: [Validators.required()],
  Website: [Validators.pattern(new RegExp('^https?://.+'))],
  InternalNote: [Validators.maxLength(256)],
} satisfies ValidatorMap;

export const identityRoleExtensionValidators = {
  Department: [Validators.maxLength(128)],
} satisfies ValidatorMap;
