import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type FormPropOptions,
} from '@lsw-abpvue/components';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import type { IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import RoleNameCell from '../components/RoleNameCell.vue';
import { IDENTITY_PRO_ROLES_PAGE } from '../tokens/roles-page.token.js';

export const DEFAULT_IDENTITY_PRO_ROLES_ENTITY_PROPS = EntityProp.createMany<IdentityRoleDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::RoleName',
    sortable: true,
    component: RoleNameCell,
  },
  { type: PropType.Number, name: 'userCount', displayName: 'AbpIdentity::UserCount' },
]);

const fields: FormPropOptions<IdentityRoleDto>[] = [
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::RoleName',
    id: 'role-name',
    disabled: data => data?.record.isStatic === true,
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    type: PropType.Boolean,
    name: 'isDefault',
    displayName: 'AbpIdentity::DisplayName:IsDefault',
    id: 'role-is-default',
    defaultValue: false,
  },
  {
    type: PropType.Boolean,
    name: 'isPublic',
    displayName: 'AbpIdentity::DisplayName:IsPublic',
    id: 'role-is-public',
    defaultValue: false,
  },
];

export const DEFAULT_IDENTITY_PRO_ROLES_CREATE_FORM_PROPS = FormProp.createMany(fields);
export const DEFAULT_IDENTITY_PRO_ROLES_EDIT_FORM_PROPS = FormProp.createMany(fields);

export const DEFAULT_IDENTITY_PRO_ROLES_ENTITY_ACTIONS = EntityAction.createMany<IdentityRoleDto>([
  {
    text: 'AbpIdentity::ChangeHistory',
    icon: 'bi bi-clock-history',
    permission: IdentityProPolicyNames.RolesChangeHistory,
    visible: data => Boolean(data?.getInjected(SHOW_ENTITY_HISTORY, null)),
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).viewHistory(data.record),
  },
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: IdentityProPolicyNames.RolesUpdate,
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).edit(data.record),
  },
  {
    text: 'AbpIdentity::Claims',
    icon: 'bi bi-list-check',
    permission: IdentityProPolicyNames.RolesUpdate,
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).manageClaims(data.record),
  },
  {
    text: 'AbpIdentity::Permissions',
    icon: 'bi bi-key',
    permission: IdentityProPolicyNames.RolesManagePermissions,
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).managePermissions(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: IdentityProPolicyNames.RolesDelete,
    visible: data => data?.record.isStatic !== true,
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).remove(data.record),
  },
  {
    text: 'AbpIdentity::MoveAllUsers',
    icon: 'bi bi-people',
    permission: IdentityProPolicyNames.RolesUpdate,
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).moveAllUsers(data.record),
  },
]);

export const DEFAULT_IDENTITY_PRO_ROLES_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly IdentityRoleDto[]
>([
  {
    text: 'AbpIdentity::NewRole',
    icon: 'bi bi-plus',
    permission: IdentityProPolicyNames.RolesCreate,
    action: data => data.getInjected(IDENTITY_PRO_ROLES_PAGE).add(),
  },
]);
