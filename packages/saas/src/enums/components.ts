export const SaasComponents = {
  Editions: 'Saas.EditionsComponent',
  Tenants: 'Saas.TenantsComponent',
  ConnectionStrings: 'Saas.ConnectionStringsComponent',
  SetTenantPassword: 'Saas.SetTenantPasswordComponent',
} as const;

export type SaasComponents = (typeof SaasComponents)[keyof typeof SaasComponents];
