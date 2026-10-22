import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type {
  ClaimTypeDto,
  IdentityRoleDto,
  IdentityUserDto,
  IdentitySecurityLogDto,
  OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import type { IdentityProComponents } from '../enums/components.js';

/** Contributions retain the commercial record type of each page. */
export type IdentityProEntityPropContributors = Partial<{
  [IdentityProComponents.OrganizationMembers]: EntityPropContributorCallback<IdentityUserDto>[];
  [IdentityProComponents.OrganizationRoles]: EntityPropContributorCallback<IdentityRoleDto>[];
  [IdentityProComponents.SecurityLogs]: EntityPropContributorCallback<IdentitySecurityLogDto>[];
  [IdentityProComponents.Roles]: EntityPropContributorCallback<IdentityRoleDto>[];
  [IdentityProComponents.Claims]: EntityPropContributorCallback<ClaimTypeDto>[];
  [IdentityProComponents.Users]: EntityPropContributorCallback<IdentityUserDto>[];
}>;

export type IdentityProFormPropContributors = Partial<{
  [IdentityProComponents.OrganizationUnits]: FormPropContributorCallback<OrganizationUnitWithDetailsDto>[];
  [IdentityProComponents.Roles]: FormPropContributorCallback<IdentityRoleDto>[];
  [IdentityProComponents.Claims]: FormPropContributorCallback<ClaimTypeDto>[];
  [IdentityProComponents.Users]: FormPropContributorCallback<IdentityUserDto>[];
}>;

export type IdentityProEntityActionContributors = Partial<{
  [IdentityProComponents.OrganizationMembers]: EntityActionContributorCallback<IdentityUserDto>[];
  [IdentityProComponents.OrganizationRoles]: EntityActionContributorCallback<IdentityRoleDto>[];
  [IdentityProComponents.SecurityLogs]: EntityActionContributorCallback<IdentitySecurityLogDto>[];
  [IdentityProComponents.Roles]: EntityActionContributorCallback<IdentityRoleDto>[];
  [IdentityProComponents.Claims]: EntityActionContributorCallback<ClaimTypeDto>[];
  [IdentityProComponents.Users]: EntityActionContributorCallback<IdentityUserDto>[];
}>;

export type IdentityProToolbarActionContributors = Partial<{
  [IdentityProComponents.OrganizationUnits]: ToolbarActionContributorCallback<
    readonly OrganizationUnitWithDetailsDto[]
  >[];
  [IdentityProComponents.SecurityLogs]: ToolbarActionContributorCallback<
    readonly IdentitySecurityLogDto[]
  >[];
  [IdentityProComponents.Roles]: ToolbarActionContributorCallback<readonly IdentityRoleDto[]>[];
  [IdentityProComponents.Claims]: ToolbarActionContributorCallback<readonly ClaimTypeDto[]>[];
  [IdentityProComponents.Users]: ToolbarActionContributorCallback<readonly IdentityUserDto[]>[];
}>;

export const IDENTITY_PRO_ENTITY_PROP_CONTRIBUTORS = defineToken<IdentityProEntityPropContributors>(
  'IDENTITY_PRO_ENTITY_PROP_CONTRIBUTORS',
);
export const IDENTITY_PRO_CREATE_FORM_PROP_CONTRIBUTORS =
  defineToken<IdentityProFormPropContributors>('IDENTITY_PRO_CREATE_FORM_PROP_CONTRIBUTORS');
export const IDENTITY_PRO_EDIT_FORM_PROP_CONTRIBUTORS =
  defineToken<IdentityProFormPropContributors>('IDENTITY_PRO_EDIT_FORM_PROP_CONTRIBUTORS');
export const IDENTITY_PRO_ENTITY_ACTION_CONTRIBUTORS =
  defineToken<IdentityProEntityActionContributors>('IDENTITY_PRO_ENTITY_ACTION_CONTRIBUTORS');
export const IDENTITY_PRO_TOOLBAR_ACTION_CONTRIBUTORS =
  defineToken<IdentityProToolbarActionContributors>('IDENTITY_PRO_TOOLBAR_ACTION_CONTRIBUTORS');
