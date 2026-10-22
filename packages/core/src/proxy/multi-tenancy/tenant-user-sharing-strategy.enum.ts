import { mapEnumToOptions } from '../../proxy-core.js';

export enum TenantUserSharingStrategy {
  Isolated = 0,
  Shared = 1,
}

export const tenantUserSharingStrategyOptions = mapEnumToOptions(TenantUserSharingStrategy);
