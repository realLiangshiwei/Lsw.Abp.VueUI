import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum ImportUsersFromFileType {
  Excel = 1,
  Csv = 2,
}

export const importUsersFromFileTypeOptions = mapEnumToOptions(ImportUsersFromFileType);
