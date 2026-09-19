/**
 * The component keys ABP's Angular tenant management module uses, verbatim, so a
 * configuration written against `@abp/ng.tenant-management` moves over unchanged.
 */
export const TenantManagementComponents = {
  Tenants: 'TenantManagement.TenantsComponent',
} as const;

export type TenantManagementComponent =
  (typeof TenantManagementComponents)[keyof typeof TenantManagementComponents];
