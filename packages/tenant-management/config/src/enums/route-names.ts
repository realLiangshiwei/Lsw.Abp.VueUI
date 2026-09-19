/** The route names ABP's Angular tenant management module uses, verbatim. */
export const TenantManagementRouteNames = {
  TenantManagement: 'AbpTenantManagement::Menu:TenantManagement',
  Tenants: 'AbpTenantManagement::Tenants',
} as const;

export type TenantManagementRouteName =
  (typeof TenantManagementRouteNames)[keyof typeof TenantManagementRouteNames];
