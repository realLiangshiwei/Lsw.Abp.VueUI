import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import type { TenantDto } from '@lsw-abpvue/tenant-management/proxy';
import {
  DEFAULT_TENANTS_CREATE_FORM_PROPS,
  DEFAULT_TENANTS_EDIT_FORM_PROPS,
  DEFAULT_TENANTS_ENTITY_ACTIONS,
  DEFAULT_TENANTS_ENTITY_PROPS,
  DEFAULT_TENANTS_TOOLBAR_ACTIONS,
} from '../defaults/tenants.js';
import { TenantManagementComponents } from '../enums/components.js';
import {
  TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
  type TenantManagementEntityActionContributors,
  type TenantManagementEntityPropContributors,
  type TenantManagementFormPropContributors,
  type TenantManagementToolbarActionContributors,
} from '../tokens/extensions.token.js';

/**
 * Assembles the five extension points before the page is allowed to render, in the order
 * that decides priority: the module's defaults, then what the backend's object extensions
 * add, then what the application contributed (design 05 §6).
 *
 * Running it again is harmless: a repeated navigation replaces the contributors rather
 * than adding a second copy of every column.
 */
export function tenantManagementExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const extensions = injector.get(ExtensionsService);
  const optional = { optional: true } as const;
  const key = TenantManagementComponents.Tenants;
  const entities = getObjectExtensionEntities(injector, 'TenantManagement');

  const entityProps: TenantManagementEntityPropContributors =
    injector.get(TENANT_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const createFormProps: TenantManagementFormPropContributors =
    injector.get(TENANT_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const editFormProps: TenantManagementFormPropContributors =
    injector.get(TENANT_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const entityActions: TenantManagementEntityActionContributors =
    injector.get(TENANT_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS, {}, optional) ?? {};
  const toolbarActions: TenantManagementToolbarActionContributors =
    injector.get(TENANT_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS, {}, optional) ?? {};

  const fromBackend = mapEntitiesToContributors<TenantDto>(
    injector,
    { [key]: entities.Tenant },
    'AbpTenantManagement',
  );

  mergeWithDefaultProps(
    extensions.entityProps,
    { [key]: DEFAULT_TENANTS_ENTITY_PROPS },
    fromBackend.prop,
    { [key]: entityProps[key] ?? [] },
  );

  mergeWithDefaultProps(
    extensions.createFormProps,
    { [key]: DEFAULT_TENANTS_CREATE_FORM_PROPS },
    fromBackend.createForm,
    { [key]: createFormProps[key] ?? [] },
  );

  mergeWithDefaultProps(
    extensions.editFormProps,
    { [key]: DEFAULT_TENANTS_EDIT_FORM_PROPS },
    fromBackend.editForm,
    { [key]: editFormProps[key] ?? [] },
  );

  mergeWithDefaultActions(
    extensions.entityActions,
    { [key]: DEFAULT_TENANTS_ENTITY_ACTIONS },
    { [key]: entityActions[key] ?? [] },
  );

  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [key]: DEFAULT_TENANTS_TOOLBAR_ACTIONS },
    { [key]: toolbarActions[key] ?? [] },
  );
}
