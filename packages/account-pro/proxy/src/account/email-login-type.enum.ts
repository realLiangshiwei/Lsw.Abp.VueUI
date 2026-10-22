import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum EmailLoginType {
  OtpAndMagicLink = 0,
  MagicLinkOnly = 1,
  OtpOnly = 2,
}

export const emailLoginTypeOptions = mapEnumToOptions(EmailLoginType);
