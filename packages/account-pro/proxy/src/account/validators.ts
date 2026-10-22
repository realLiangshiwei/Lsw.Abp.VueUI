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
  AcceptInvitationInput,
  AccountEmailLoginSettingsDto,
  AccountRecaptchaSettingsDto,
  ChangeEmailInput,
  ChangePasswordInput,
  CheckEmailConfirmationCodeDto,
  ConfirmEmailInput,
  ConfirmPhoneNumberInput,
  DelegateNewUserInput,
  GenerateLinkUserTokenInput,
  GetTwoFactorProvidersInput,
  LinkUserInput,
  RegisterDto,
  RejectInvitationInput,
  ResetPasswordDto,
  SendEmailConfirmationCodeDto,
  SendEmailConfirmationTokenDto,
  SendEmailLoginCodeDto,
  SendPasswordResetCodeDto,
  SendPhoneNumberConfirmationTokenDto,
  SendTwoFactorCodeInput,
  UpdateProfileDto,
  VerifyChangeEmailTokenInput,
  VerifyEmailConfirmationTokenInput,
  VerifyEmailLoginCodeDto,
  VerifyEmailLoginLinkTokenDto,
  VerifyLinkLoginTokenInput,
  VerifyLinkTokenInput,
  VerifyPasswordResetTokenInput,
} from './models.js';

export const acceptInvitationInputValidators = {
  token: [Validators.required()],
  userName: [Validators.maxLength(256)],
  password: [Validators.maxLength(128)],
} satisfies ValidatorMap<AcceptInvitationInput>;

export const accountEmailLoginSettingsDtoValidators = {
  tokenLifespan: [Validators.range(30, 86400)],
} satisfies ValidatorMap<AccountEmailLoginSettingsDto>;

export const accountRecaptchaSettingsDtoValidators = {
  version: [Validators.range(2, 3)],
  score: [Validators.range(0.1, 1)],
} satisfies ValidatorMap<AccountRecaptchaSettingsDto>;

export const changeEmailInputValidators = {
  userId: [Validators.required()],
  newEmailAddress: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<ChangeEmailInput>;

export const changePasswordInputValidators = {
  currentPassword: [Validators.maxLength(128)],
  newPassword: [Validators.required(), Validators.maxLength(128)],
} satisfies ValidatorMap<ChangePasswordInput>;

export const checkEmailConfirmationCodeDtoValidators = {
  emailAddress: [Validators.required()],
  code: [Validators.required()],
} satisfies ValidatorMap<CheckEmailConfirmationCodeDto>;

export const confirmEmailInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<ConfirmEmailInput>;

export const confirmPhoneNumberInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<ConfirmPhoneNumberInput>;

export const delegateNewUserInputValidators = {
  startTime: [Validators.required()],
  endTime: [Validators.required()],
} satisfies ValidatorMap<DelegateNewUserInput>;

export const generateLinkUserTokenInputValidators = {
  targetUserNameOrEmail: [Validators.required(), Validators.maxLength(256)],
} satisfies ValidatorMap<GenerateLinkUserTokenInput>;

export const getTwoFactorProvidersInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<GetTwoFactorProvidersInput>;

export const linkUserInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<LinkUserInput>;

export const registerDtoValidators = {
  userName: [Validators.required(), Validators.maxLength(256)],
  emailAddress: [Validators.required(), Validators.maxLength(256)],
  password: [Validators.required(), Validators.maxLength(128)],
  appName: [Validators.required()],
} satisfies ValidatorMap<RegisterDto>;

export const rejectInvitationInputValidators = {
  token: [Validators.required()],
} satisfies ValidatorMap<RejectInvitationInput>;

export const resetPasswordDtoValidators = {
  resetToken: [Validators.required()],
  password: [Validators.required()],
} satisfies ValidatorMap<ResetPasswordDto>;

export const sendEmailConfirmationCodeDtoValidators = {
  emailAddress: [Validators.required()],
  userName: [Validators.required()],
} satisfies ValidatorMap<SendEmailConfirmationCodeDto>;

export const sendEmailConfirmationTokenDtoValidators = {
  appName: [Validators.required()],
  userId: [Validators.required()],
} satisfies ValidatorMap<SendEmailConfirmationTokenDto>;

export const sendEmailLoginCodeDtoValidators = {
  emailAddress: [Validators.required()],
  appName: [Validators.required()],
} satisfies ValidatorMap<SendEmailLoginCodeDto>;

export const sendPasswordResetCodeDtoValidators = {
  email: [Validators.required(), Validators.maxLength(256)],
  appName: [Validators.required()],
} satisfies ValidatorMap<SendPasswordResetCodeDto>;

export const sendPhoneNumberConfirmationTokenDtoValidators = {
  userId: [Validators.required()],
} satisfies ValidatorMap<SendPhoneNumberConfirmationTokenDto>;

export const sendTwoFactorCodeInputValidators = {
  userId: [Validators.required()],
  provider: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<SendTwoFactorCodeInput>;

export const updateProfileDtoValidators = {
  userName: [Validators.required(), Validators.maxLength(256)],
  email: [Validators.maxLength(256)],
  name: [Validators.maxLength(64)],
  surname: [Validators.maxLength(64)],
  phoneNumber: [Validators.maxLength(16)],
  appName: [Validators.required()],
} satisfies ValidatorMap<UpdateProfileDto>;

export const verifyChangeEmailTokenInputValidators = {
  userId: [Validators.required()],
  newEmailAddress: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<VerifyChangeEmailTokenInput>;

export const verifyEmailConfirmationTokenInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<VerifyEmailConfirmationTokenInput>;

export const verifyEmailLoginCodeDtoValidators = {
  emailAddress: [Validators.required()],
  code: [Validators.required(), Validators.maxLength(6), Validators.minLength(6)],
} satisfies ValidatorMap<VerifyEmailLoginCodeDto>;

export const verifyEmailLoginLinkTokenDtoValidators = {
  token: [Validators.required()],
} satisfies ValidatorMap<VerifyEmailLoginLinkTokenDto>;

export const verifyLinkLoginTokenInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<VerifyLinkLoginTokenInput>;

export const verifyLinkTokenInputValidators = {
  userId: [Validators.required()],
  token: [Validators.required()],
} satisfies ValidatorMap<VerifyLinkTokenInput>;

export const verifyPasswordResetTokenInputValidators = {
  resetToken: [Validators.required()],
} satisfies ValidatorMap<VerifyPasswordResetTokenInput>;
