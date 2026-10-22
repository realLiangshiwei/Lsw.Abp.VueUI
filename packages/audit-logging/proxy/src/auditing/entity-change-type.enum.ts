import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum EntityChangeType {
  Created = 0,
  Updated = 1,
  Deleted = 2,
}

export const entityChangeTypeOptions = mapEnumToOptions(EntityChangeType);
