import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum UserInvitationStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Canceled = 3,
}

export const userInvitationStatusOptions = mapEnumToOptions(UserInvitationStatus);
