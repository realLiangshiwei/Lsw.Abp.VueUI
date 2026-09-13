import type { ExtensibleObject } from '@lsw-abpvue/core';

export interface ChangePasswordInput {
  currentPassword?: string | undefined;
  newPassword: string;
}

export interface ProfileDto extends ExtensibleObject {
  userName?: string | undefined;
  email?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  phoneNumber?: string | undefined;
  isExternal: boolean;
  hasPassword: boolean;
  concurrencyStamp?: string | undefined;
}

export interface RegisterDto extends ExtensibleObject {
  userName: string;
  emailAddress: string;
  password: string;
  appName: string;
}

export interface ResetPasswordDto {
  userId?: string | undefined;
  resetToken: string;
  password: string;
}

export interface SendPasswordResetCodeDto {
  email: string;
  appName: string;
  returnUrl?: string | undefined;
  returnUrlHash?: string | undefined;
}

export interface UpdateProfileDto extends ExtensibleObject {
  userName?: string | undefined;
  email?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  phoneNumber?: string | undefined;
  concurrencyStamp?: string | undefined;
}

export interface VerifyPasswordResetTokenInput {
  userId?: string | undefined;
  resetToken: string;
}
