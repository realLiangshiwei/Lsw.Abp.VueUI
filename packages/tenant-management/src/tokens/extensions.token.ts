import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { TenantDto } from '@lsw-abpvue/tenant-management/proxy';
import type { TenantManagementComponents } from '../enums/components.js';

/** The contributors a host may register, keyed by component key, as Angular keys them. */
export type TenantManagementEntityPropContributors = Partial<{
  [TenantManagementComponents.Tenants]: EntityPropContributorCallback<TenantDto>[];
}>;

export type TenantManagementFormPropContributors = Partial<{
  [TenantManagementComponents.Tenants]: FormPropContributorCallback<TenantDto>[];
}>;

export type TenantManagementEntityActionContributors = Partial<{
  [TenantManagementComponents.Tenants]: EntityActionContributorCallback<TenantDto>[];
}>;

export type TenantManagementToolbarActionContributors = Partial<{
  [TenantManagementComponents.Tenants]: ToolbarActionContributorCallback<readonly TenantDto[]>[];
}>;

export const TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS =
  defineToken<TenantManagementEntityPropContributors>('TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS');

export const TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS =
  defineToken<TenantManagementFormPropContributors>(
    'TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS',
  );

export const TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS =
  defineToken<TenantManagementFormPropContributors>(
    'TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS',
  );

export const TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS =
  defineToken<TenantManagementEntityActionContributors>(
    'TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS',
  );

export const TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS =
  defineToken<TenantManagementToolbarActionContributors>(
    'TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS',
  );

/** What the tenants page offers its row and toolbar buttons. */
export interface TenantsPageCommands {
  add(): void;
  edit(tenant: TenantDto): Promise<void>;
  remove(tenant: TenantDto): Promise<void>;
  manageFeatures(tenant: TenantDto): void;
  manageConnectionString(tenant: TenantDto): void;
}

export const TENANTS_PAGE = defineToken<TenantsPageCommands>('TENANTS_PAGE');
