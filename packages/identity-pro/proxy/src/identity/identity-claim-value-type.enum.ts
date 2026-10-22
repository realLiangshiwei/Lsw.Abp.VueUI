import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum IdentityClaimValueType {
  String = 0,
  Int = 1,
  Boolean = 2,
  DateTime = 3,
}

export const identityClaimValueTypeOptions = mapEnumToOptions(IdentityClaimValueType);
