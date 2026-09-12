// What the backend already declares about its own values, as validators a form can
// spread into its controls. Two sources: the data annotations on a DTO property, and
// the attributes on an object extension property.
//
// The maps are sparse on purpose. A rule the backend enforces in code rather than in an
// attribute is not here, and a form still says whatever else it needs to say.

import { Validators } from '@lsw-abpvue/theme-shared';
import type { ValidatorMap } from '@lsw-abpvue/theme-shared';
import type { SendTestEmailInput, UpdateEmailSettingsDto } from './models.js';

export const sendTestEmailInputValidators = {
  senderEmailAddress: [Validators.required()],
  targetEmailAddress: [Validators.required()],
  subject: [Validators.required()],
} satisfies ValidatorMap<SendTestEmailInput>;

export const updateEmailSettingsDtoValidators = {
  smtpHost: [Validators.maxLength(256)],
  smtpPort: [Validators.range(1, 65535)],
  smtpUserName: [Validators.maxLength(1024)],
  smtpPassword: [Validators.maxLength(1024)],
  smtpDomain: [Validators.maxLength(1024)],
  defaultFromAddress: [Validators.required(), Validators.maxLength(1024)],
  defaultFromDisplayName: [Validators.required(), Validators.maxLength(1024)],
} satisfies ValidatorMap<UpdateEmailSettingsDto>;
