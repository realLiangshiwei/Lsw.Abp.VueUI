import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum IdentityProPreventConcurrentLoginBehaviour {
  Disabled = 0,
  LogoutFromSameTypeDevices = 1,
  LogoutFromAllDevices = 2,
}

export const identityProPreventConcurrentLoginBehaviourOptions = mapEnumToOptions(
  IdentityProPreventConcurrentLoginBehaviour,
);
