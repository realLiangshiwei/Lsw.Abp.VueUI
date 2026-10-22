import type {
  EntityDto,
  ExtensibleObject,
  ExtensiblePagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';
import type { IdentityProTwoFactorBehaviour } from '../identity/features/identity-pro-two-factor-behaviour.enum.js';
import type { EmailLoginType } from './email-login-type.enum.js';
import type { ExternalProviderSettings } from './external-providers/models.js';
import type { ProfilePictureType } from './profile-picture-type.enum.js';

export interface AcceptInvitationInput {
  token: string;
  userName?: string | undefined;
  password?: string | undefined;
}

export interface AccountEmailLoginSettingsDto {
  enabled?: boolean | undefined;
  loginType?: EmailLoginType | undefined;
  tokenLifespan?: number | undefined;
}

export interface AccountExternalLoginDto {
  loginProvider?: string | undefined;
  providerKey?: string | undefined;
  providerDisplayName?: string | undefined;
}

export interface AccountExternalProviderSettingsDto {
  verifyPasswordDuringExternalLogin?: boolean | undefined;
  externalProviders?: ExternalProviderSettings[] | undefined;
}

export interface AccountIdleSettingsDto {
  enabled?: boolean | undefined;
  idleTimeoutMinutes?: number | undefined;
  countdownSeconds?: number | undefined;
}

export interface AccountPasskeySettingsDto {
  enabled?: boolean | undefined;
  maximumPasskeysPerUser?: number | undefined;
}

export interface AccountRecaptchaSettingsDto {
  useCaptchaOnLogin?: boolean | undefined;
  useCaptchaOnRegistration?: boolean | undefined;
  useCaptchaOnForgotPassword?: boolean | undefined;
  verifyBaseUrl?: string | undefined;
  siteKey?: string | undefined;
  siteSecret?: string | undefined;
  version?: number | undefined;
  score?: number | undefined;
}

export interface AccountSettingsDto {
  isSelfRegistrationEnabled?: boolean | undefined;
  enableLocalLogin?: boolean | undefined;
  preventEmailEnumeration?: boolean | undefined;
}

export interface AccountTwoFactorSettingsDto {
  twoFactorBehaviour?: IdentityProTwoFactorBehaviour | undefined;
  isRememberBrowserEnabled?: boolean | undefined;
  usersCanChange?: boolean | undefined;
}

export interface AuthenticatorInfoDto {
  key?: string | undefined;
  uri?: string | undefined;
}

export interface ChangeEmailInput {
  userId: string;
  newEmailAddress: string;
  token: string;
}

export interface ChangePasswordInput {
  currentPassword?: string | undefined;
  newPassword: string;
}

export interface CheckEmailConfirmationCodeDto {
  emailAddress: string;
  code: string;
}

export interface ConfirmEmailInput {
  userId: string;
  token: string;
}

export interface ConfirmPhoneNumberInput {
  userId: string;
  token: string;
}

export interface DelegateNewUserInput {
  targetUserId?: string | undefined;
  startTime: string;
  endTime: string;
}

export interface EmailConfirmationCodeLimitDto {
  nextSendTime?: string | null | undefined;
  nextTryTime?: string | null | undefined;
}

export interface EmailLoginCodeLimitDto {
  nextSendTime?: string | null | undefined;
  nextTryTime?: string | null | undefined;
}

export interface GenerateLinkUserTokenInput {
  targetUserNameOrEmail: string;
}

export interface GetAccountIdentitySessionListInput extends ExtensiblePagedAndSortedResultRequestDto {
  device?: string | undefined;
  clientId?: string | undefined;
}

export interface GetTwoFactorProvidersInput {
  userId: string;
  token: string;
}

export interface GetUserLookupInput {
  userName?: string | undefined;
}

export interface IdentityUserConfirmationStateDto {
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
}

export interface InvitationInfoDto {
  inviteeEmail?: string | undefined;
  tenantName?: string | undefined;
  tenantId?: string | null | undefined;
  requireRegister: boolean;
  suggestedUserName?: string | undefined;
}

export interface IsLinkedInput {
  userId?: string | undefined;
  tenantId?: string | null | undefined;
}

export interface LeaveTenantInput {
  tenantId?: string | null | undefined;
}

export interface LinkUserDto {
  targetUserId: string;
  targetUserName?: string | undefined;
  targetTenantId?: string | null | undefined;
  targetTenantName?: string | undefined;
  directlyLinked: boolean;
}

export interface LinkUserInput {
  userId: string;
  tenantId?: string | null | undefined;
  token: string;
}

export interface PasskeyDto {
  credentialId?: string | undefined;
  name?: string | undefined;
  createdAt: string;
}

export interface ProfileDto extends ExtensibleObject {
  userName?: string | undefined;
  email?: string | undefined;
  emailConfirmed: boolean;
  name?: string | undefined;
  surname?: string | undefined;
  phoneNumber?: string | undefined;
  phoneNumberConfirmed: boolean;
  isExternal: boolean;
  hasPassword: boolean;
  supportsMultipleTimezone: boolean;
  timezone?: string | undefined;
  concurrencyStamp?: string | undefined;
}

export interface ProfilePictureSourceDto {
  type: ProfilePictureType;
  source?: string | undefined;
  fileContent?: string | number[] | undefined;
}

export interface RegisterDto extends ExtensibleObject {
  userName: string;
  emailAddress: string;
  password: string;
  appName: string;
  returnUrl?: string | undefined;
  returnUrlHash?: string | undefined;
  code?: string | undefined;
  captchaResponse?: string | undefined;
}

export interface RejectInvitationInput {
  token: string;
}

export interface ResetPasswordDto {
  userId?: string | undefined;
  resetToken: string;
  password: string;
}

export interface SendEmailConfirmationCodeDto {
  emailAddress: string;
  userName: string;
  captchaResponse?: string | undefined;
}

export interface SendEmailConfirmationTokenDto {
  appName: string;
  userId: string;
  returnUrl?: string | undefined;
  returnUrlHash?: string | undefined;
}

export interface SendEmailLoginCodeDto {
  emailAddress: string;
  appName: string;
  returnUrl?: string | undefined;
  returnUrlHash?: string | undefined;
  captchaResponse?: string | undefined;
}

export interface SendEmailLoginCodeResultDto {
  expiresAt: string;
}

export interface SendPasswordResetCodeDto {
  email: string;
  appName: string;
  returnUrl?: string | undefined;
  returnUrlHash?: string | undefined;
  captchaResponse?: string | undefined;
}

export interface SendPhoneNumberConfirmationTokenDto {
  userId: string;
  phoneNumber?: string | undefined;
}

export interface SendTwoFactorCodeInput {
  userId: string;
  provider: string;
  token: string;
}

export interface UnLinkUserInput {
  userId?: string | undefined;
  tenantId?: string | null | undefined;
}

export interface UpdateProfileDto extends ExtensibleObject {
  userName: string;
  email?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  phoneNumber?: string | undefined;
  timezone?: string | undefined;
  concurrencyStamp?: string | undefined;
  appName: string;
  returnUrl?: string | undefined;
  returnUrlHash?: string | undefined;
}

export interface UserDelegationDto extends EntityDto<string> {
  userName?: string | undefined;
  startTime: string;
  endTime: string;
}

export interface UserLookupDto extends EntityDto<string> {
  userName?: string | undefined;
}

export interface UserSharingDto {
  tenantId?: string | null | undefined;
  tenantName?: string | undefined;
  email?: string | undefined;
}

export interface VerifyAuthenticatorCodeDto {
  recoveryCodes?: string[] | undefined;
}

export interface VerifyAuthenticatorCodeInput {
  code?: string | undefined;
}

export interface VerifyChangeEmailTokenInput {
  userId: string;
  newEmailAddress: string;
  token: string;
}

export interface VerifyEmailConfirmationTokenInput {
  userId: string;
  token: string;
}

export interface VerifyEmailLoginCodeDto {
  emailAddress: string;
  code: string;
}

export interface VerifyEmailLoginCodeResultDto {
  token?: string | undefined;
  tenantId?: string | null | undefined;
}

export interface VerifyEmailLoginLinkTokenDto {
  token: string;
}

export interface VerifyEmailLoginLinkTokenResultDto {
  emailAddress?: string | undefined;
  tenantId?: string | null | undefined;
}

export interface VerifyLinkLoginTokenInput {
  userId: string;
  tenantId?: string | null | undefined;
  token: string;
}

export interface VerifyLinkTokenInput {
  userId: string;
  tenantId?: string | null | undefined;
  token: string;
}

export interface VerifyPasswordResetTokenInput {
  userId?: string | undefined;
  resetToken: string;
}
