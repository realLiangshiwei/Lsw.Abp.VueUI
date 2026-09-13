import type { TenantUserSharingStrategy } from '../../../multi-tenancy/tenant-user-sharing-strategy.enum.js';

export interface CurrentTenantDto {
  id?: string | null | undefined;
  name?: string | null | undefined;
  isAvailable?: boolean | undefined;
}

export interface FindTenantResultDto {
  success?: boolean | undefined;
  tenantId?: string | null | undefined;
  name?: string | null | undefined;
  normalizedName?: string | null | undefined;
  isActive?: boolean | undefined;
}

export interface MultiTenancyInfoDto {
  isEnabled?: boolean | undefined;
  userSharingStrategy?: TenantUserSharingStrategy | undefined;
}
