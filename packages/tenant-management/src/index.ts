export { default as AbpTenantConnectionString } from './components/AbpTenantConnectionString.vue';
export { default as TenantsPage } from './components/TenantsPage.vue';

export {
  DEFAULT_TENANTS_CREATE_FORM_PROPS,
  DEFAULT_TENANTS_EDIT_FORM_PROPS,
  DEFAULT_TENANTS_ENTITY_ACTIONS,
  DEFAULT_TENANTS_ENTITY_PROPS,
  DEFAULT_TENANTS_TOOLBAR_ACTIONS,
} from './defaults/tenants.js';

export { TenantManagementComponents } from './enums/components.js';
export type { TenantManagementComponent } from './enums/components.js';

export type { TenantManagementConfigOptions } from './models/config-options.js';

export { provideTenantManagement } from './providers/tenant-management.provider.js';

export { tenantManagementExtensionsResolver } from './resolvers/extensions.resolver.js';

export { createTenantManagementRoutes } from './routes.js';

export {
  TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
  TENANTS_PAGE,
} from './tokens/extensions.token.js';
export type {
  TenantManagementEntityActionContributors,
  TenantManagementEntityPropContributors,
  TenantManagementFormPropContributors,
  TenantManagementToolbarActionContributors,
  TenantsPageCommands,
} from './tokens/extensions.token.js';
