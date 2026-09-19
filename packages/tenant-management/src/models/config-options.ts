import type {
  TenantManagementEntityActionContributors,
  TenantManagementEntityPropContributors,
  TenantManagementFormPropContributors,
  TenantManagementToolbarActionContributors,
} from '../tokens/extensions.token.js';

/**
 * What a host may contribute to the tenants page, named as `@abp/ng.tenant-management`
 * names it.
 */
export interface TenantManagementConfigOptions {
  entityPropContributors?: TenantManagementEntityPropContributors | undefined;
  createFormPropContributors?: TenantManagementFormPropContributors | undefined;
  editFormPropContributors?: TenantManagementFormPropContributors | undefined;
  entityActionContributors?: TenantManagementEntityActionContributors | undefined;
  toolbarActionContributors?: TenantManagementToolbarActionContributors | undefined;
}
