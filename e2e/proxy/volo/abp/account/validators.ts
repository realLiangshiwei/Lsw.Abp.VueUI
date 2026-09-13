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
import type {
  ChangePasswordInput,
  RegisterDto,
  ResetPasswordDto,
  SendPasswordResetCodeDto,
  UpdateProfileDto,
  VerifyPasswordResetTokenInput,
} from './models.js';

export const changePasswordInputValidators = {
  currentPassword: [Validators.maxLength(128)],
  newPassword: [Validators.required(), Validators.maxLength(128)],
} satisfies ValidatorMap<ChangePasswordInput>;

export const registerDtoValidators = {
  userName: [Validators.required(), Validators.maxLength(256)],
  emailAddress: [Validators.required(), Validators.maxLength(256)],
  password: [Validators.required(), Validators.maxLength(128)],
  appName: [Validators.required()],
} satisfies ValidatorMap<RegisterDto>;

export const resetPasswordDtoValidators = {
  resetToken: [Validators.required()],
  password: [Validators.required()],
} satisfies ValidatorMap<ResetPasswordDto>;

export const sendPasswordResetCodeDtoValidators = {
  email: [Validators.required(), Validators.maxLength(256)],
  appName: [Validators.required()],
} satisfies ValidatorMap<SendPasswordResetCodeDto>;

export const updateProfileDtoValidators = {
  userName: [Validators.maxLength(256)],
  email: [Validators.maxLength(256)],
  name: [Validators.maxLength(64)],
  surname: [Validators.maxLength(64)],
  phoneNumber: [Validators.maxLength(16)],
} satisfies ValidatorMap<UpdateProfileDto>;

export const verifyPasswordResetTokenInputValidators = {
  resetToken: [Validators.required()],
} satisfies ValidatorMap<VerifyPasswordResetTokenInput>;
