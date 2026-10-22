import type { TenantUserSharingStrategy } from '../../../multi-tenancy/tenant-user-sharing-strategy.enum.js';

export interface CurrentTenantDto {
  id?: string | null | undefined;
  name?: string | null | undefined;
  isAvailable: boolean;
}

export interface FindTenantResultDto {
  success: boolean;
  tenantId?: string | null | undefined;
  name?: string | null | undefined;
  normalizedName?: string | null | undefined;
  isActive: boolean;
}

export interface MultiTenancyInfoDto {
  isEnabled: boolean;
  userSharingStrategy: TenantUserSharingStrategy;
}
