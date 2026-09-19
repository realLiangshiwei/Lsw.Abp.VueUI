/** The permission names the tenant management module checks. */
export const TenantManagementPolicyNames = {
  TenantManagement: 'AbpTenantManagement.Tenants',
  Tenants: 'AbpTenantManagement.Tenants',
  TenantsCreate: 'AbpTenantManagement.Tenants.Create',
  TenantsUpdate: 'AbpTenantManagement.Tenants.Update',
  TenantsDelete: 'AbpTenantManagement.Tenants.Delete',
  TenantsManageFeatures: 'AbpTenantManagement.Tenants.ManageFeatures',
  TenantsManageConnectionStrings: 'AbpTenantManagement.Tenants.ManageConnectionStrings',
} as const;

export type TenantManagementPolicyName =
  (typeof TenantManagementPolicyNames)[keyof typeof TenantManagementPolicyNames];
