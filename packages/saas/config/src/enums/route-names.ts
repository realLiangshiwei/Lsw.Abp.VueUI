export const SaasRouteNames = {
  Saas: 'Saas::Menu:Saas',
  Tenants: 'Saas::Tenants',
  Editions: 'Saas::Editions',
} as const;

export const SaasSettingTabNames = { SaasManagement: 'Saas::Menu:SaasManagement' } as const;
export const SaasAuthFilterNames = { Impersonation: 'Impersonation' } as const;
export const SAAS_CONNECTION_STRING_SETTING =
  'Volo.Saas.EnableTenantBasedConnectionStringManagement';
