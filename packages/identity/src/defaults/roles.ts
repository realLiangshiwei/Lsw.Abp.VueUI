import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type FormPropOptions,
} from '@lsw-abpvue/components';
import { IdentityPolicyNames } from '@lsw-abpvue/identity/config';
import type { IdentityRoleDto } from '@lsw-abpvue/identity/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import RoleNameCell from '../components/RoleNameCell.vue';
import { ROLES_PAGE } from '../tokens/extensions.token.js';

/** What the module itself puts on the roles page. */
export const DEFAULT_ROLES_ENTITY_PROPS = EntityProp.createMany<IdentityRoleDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::RoleName',
    sortable: true,
    // The default and public badges. Angular concatenates them into an HTML string.
    component: RoleNameCell,
  },
]);

const ROLE_FIELDS: FormPropOptions<IdentityRoleDto>[] = [
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::RoleName',
    id: 'role-name',
    // A static role is one the application declared in code; its name is not ours to change.
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

export const DEFAULT_ROLES_CREATE_FORM_PROPS = FormProp.createMany<IdentityRoleDto>(ROLE_FIELDS);

export const DEFAULT_ROLES_EDIT_FORM_PROPS = DEFAULT_ROLES_CREATE_FORM_PROPS;

export const DEFAULT_ROLES_ENTITY_ACTIONS = EntityAction.createMany<IdentityRoleDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: IdentityPolicyNames.RolesUpdate,
    action: data => data.getInjected(ROLES_PAGE).edit(data.record),
  },
  {
    text: 'AbpIdentity::Permissions',
    icon: 'bi bi-key',
    permission: IdentityPolicyNames.RolesManagePermissions,
    action: data => data.getInjected(ROLES_PAGE).managePermissions(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: IdentityPolicyNames.RolesDelete,
    action: data => data.getInjected(ROLES_PAGE).remove(data.record),
    visible: data => data?.record.isStatic !== true,
  },
]);

export const DEFAULT_ROLES_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly IdentityRoleDto[]>([
  {
    text: 'AbpIdentity::NewRole',
    icon: 'bi bi-plus',
    permission: IdentityPolicyNames.RolesCreate,
    action: data => data.getInjected(ROLES_PAGE).add(),
  },
]);
