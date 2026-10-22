// What the backend already declares about its own values, as validators a form can
// spread into its controls. Two sources: the data annotations on a DTO property, and
// the attributes on an object extension property.
//
// The maps are sparse on purpose. A rule the backend enforces in code rather than in an
// attribute is not here, and a form still says whatever else it needs to say. A rule a
// DTO inherits stays in the map of the type that declares it, so a form that edits a
// derived DTO spreads the two together.

import { Validators } from '@lsw-abpvue/theme-shared';
import type { ValidatorMap } from '@lsw-abpvue/theme-shared';
import type { ExportAuditLogsInput, GetAuditLogListDto } from './models.js';

export const exportAuditLogsInputValidators = {
  url: [Validators.maxLength(512)],
  userName: [Validators.maxLength(128)],
  httpMethod: [Validators.maxLength(16)],
} satisfies ValidatorMap<ExportAuditLogsInput>;

export const getAuditLogListDtoValidators = {
  url: [Validators.maxLength(512)],
  userName: [Validators.maxLength(128)],
  httpMethod: [Validators.maxLength(16)],
} satisfies ValidatorMap<GetAuditLogListDto>;
