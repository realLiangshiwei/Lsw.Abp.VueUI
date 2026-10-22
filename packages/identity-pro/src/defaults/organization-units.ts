import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import type {
  IdentityRoleDto,
  IdentityUserDto,
  OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import UserIdentityCell from '../components/UserIdentityCell.vue';
import { OrganizationUnitPolicies } from '../models/organization-units.js';
import {
  ORGANIZATION_MEMBERS,
  ORGANIZATION_ROLES,
} from '../tokens/organization-units-page.token.js';

export const DEFAULT_ORGANIZATION_UNITS_CREATE_FORM_PROPS =
  FormProp.createMany<OrganizationUnitWithDetailsDto>([
    {
      type: PropType.String,
      name: 'displayName',
      displayName: 'AbpIdentity::DisplayName',
      id: 'organization-unit-display-name',
      validators: () => [Validators.required(), Validators.maxLength(128)],
    },
  ]);
export const DEFAULT_ORGANIZATION_UNITS_EDIT_FORM_PROPS =
  FormProp.createMany<OrganizationUnitWithDetailsDto>([
    {
      type: PropType.String,
      name: 'displayName',
      displayName: 'AbpIdentity::DisplayName',
      id: 'organization-unit-display-name',
      validators: () => [Validators.required(), Validators.maxLength(128)],
    },
  ]);
export const DEFAULT_ORGANIZATION_UNITS_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly OrganizationUnitWithDetailsDto[]
>([]);
export const DEFAULT_ORGANIZATION_MEMBERS_ENTITY_PROPS = EntityProp.createMany<IdentityUserDto>([
  { type: PropType.String, name: 'userName', displayName: 'AbpIdentity::UserName', sortable: true },
  {
    type: PropType.String,
    name: 'email',
    component: UserIdentityCell,
    displayName: 'AbpIdentity::EmailAddress',
    sortable: true,
  },
]);
export const DEFAULT_ORGANIZATION_ROLES_ENTITY_PROPS = EntityProp.createMany<IdentityRoleDto>([
  { type: PropType.String, name: 'name', displayName: 'AbpIdentity::RoleName', sortable: true },
]);
export const DEFAULT_ORGANIZATION_MEMBERS_ENTITY_ACTIONS = EntityAction.createMany<IdentityUserDto>(
  [
    {
      text: 'AbpUi::Delete',
      icon: 'bi bi-trash',
      permission: OrganizationUnitPolicies.ManageMembers,
      action: data => data.getInjected(ORGANIZATION_MEMBERS).remove(data.record),
    },
  ],
);
export const DEFAULT_ORGANIZATION_ROLES_ENTITY_ACTIONS = EntityAction.createMany<IdentityRoleDto>([
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: OrganizationUnitPolicies.ManageRoles,
    action: data => data.getInjected(ORGANIZATION_ROLES).remove(data.record),
  },
]);
