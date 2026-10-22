import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum ProfilePictureType {
  None = 0,
  Gravatar = 1,
  Image = 2,
}

export const profilePictureTypeOptions = mapEnumToOptions(ProfilePictureType);
