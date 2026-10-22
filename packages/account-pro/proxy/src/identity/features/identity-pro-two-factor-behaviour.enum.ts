import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum IdentityProTwoFactorBehaviour {
  Optional = 0,
  Disabled = 1,
  Forced = 2,
}

export const identityProTwoFactorBehaviourOptions = mapEnumToOptions(IdentityProTwoFactorBehaviour);
