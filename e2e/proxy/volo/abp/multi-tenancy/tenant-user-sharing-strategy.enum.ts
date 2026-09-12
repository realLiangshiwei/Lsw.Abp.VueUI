import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum TenantUserSharingStrategy {
  Isolated = 0,
  Shared = 1,
}

export const tenantUserSharingStrategyOptions = mapEnumToOptions(TenantUserSharingStrategy);
