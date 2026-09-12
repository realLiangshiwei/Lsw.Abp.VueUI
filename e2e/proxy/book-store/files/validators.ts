// What the backend already declares about its own values, as validators a form can
// spread into its controls. Two sources: the data annotations on a DTO property, and
// the attributes on an object extension property.
//
// The maps are sparse on purpose. A rule the backend enforces in code rather than in an
// attribute is not here, and a form still says whatever else it needs to say.

import { Validators } from '@lsw-abpvue/theme-shared';
import type { ValidatorMap } from '@lsw-abpvue/theme-shared';
import type { FileDescriptorDto } from './models.js';

export const fileDescriptorDtoValidators = {
  name: [Validators.required(), Validators.maxLength(64), Validators.minLength(1)],
} satisfies ValidatorMap<FileDescriptorDto>;
