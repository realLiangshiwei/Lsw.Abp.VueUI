import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type FormPropOptions,
} from '@lsw-abpvue/components';
import { TenantManagementPolicyNames } from '@lsw-abpvue/tenant-management/config';
import type { TenantDto } from '@lsw-abpvue/tenant-management/proxy';
import { getPasswordValidators, Validators } from '@lsw-abpvue/theme-shared';
import { TENANTS_PAGE } from '../tokens/extensions.token.js';

/**
 * What the module itself puts on the tenants page. A host never edits this file: it
 * registers contributors through `createTenantManagementRoutes()`, and they run after
 * these.
 */
export const DEFAULT_TENANTS_ENTITY_PROPS = EntityProp.createMany<TenantDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpTenantManagement::TenantName',
    sortable: true,
  },
]);

const TENANT_FIELDS: FormPropOptions<TenantDto>[] = [
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpTenantManagement::TenantName',
    id: 'name',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
];

export const DEFAULT_TENANTS_CREATE_FORM_PROPS = FormProp.createMany<TenantDto>([
  ...TENANT_FIELDS,
  // Only a new tenant gets an administrator; an existing one has users of its own.
  {
    type: PropType.Email,
    name: 'adminEmailAddress',
    displayName: 'AbpTenantManagement::DisplayName:AdminEmailAddress',
    id: 'admin-email-address',
    validators: () => [Validators.required(), Validators.maxLength(256), Validators.email()],
  },
  {
    type: PropType.PasswordInputGroup,
    name: 'adminPassword',
    displayName: 'AbpTenantManagement::DisplayName:AdminPassword',
    id: 'admin-password',
    autocomplete: 'new-password',
    validators: data => [Validators.required(), ...getPasswordValidators(data.getInjected)],
  },
]);

export const DEFAULT_TENANTS_EDIT_FORM_PROPS = FormProp.createMany<TenantDto>(TENANT_FIELDS);

export const DEFAULT_TENANTS_ENTITY_ACTIONS = EntityAction.createMany<TenantDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: TenantManagementPolicyNames.TenantsUpdate,
    action: data => data.getInjected(TENANTS_PAGE).edit(data.record),
  },
  {
    text: 'AbpTenantManagement::Permission:ManageFeatures',
    icon: 'bi bi-toggles',
    permission: TenantManagementPolicyNames.TenantsManageFeatures,
    action: data => data.getInjected(TENANTS_PAGE).manageFeatures(data.record),
  },
  {
    text: 'AbpTenantManagement::ConnectionStrings',
    icon: 'bi bi-database',
    permission: TenantManagementPolicyNames.TenantsManageConnectionStrings,
    action: data => data.getInjected(TENANTS_PAGE).manageConnectionString(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: TenantManagementPolicyNames.TenantsDelete,
    action: data => data.getInjected(TENANTS_PAGE).remove(data.record),
  },
]);

export const DEFAULT_TENANTS_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly TenantDto[]>([
  {
    text: 'AbpTenantManagement::NewTenant',
    icon: 'bi bi-plus',
    permission: TenantManagementPolicyNames.TenantsCreate,
    action: data => data.getInjected(TENANTS_PAGE).add(),
  },
]);
