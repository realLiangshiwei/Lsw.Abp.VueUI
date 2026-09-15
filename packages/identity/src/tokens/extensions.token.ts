import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { IdentityRoleDto, IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import type { IdentityComponents } from '../enums/components.js';

/**
 * The contributors a host may register, keyed by component key. Written out per key
 * rather than as one record, so a callback for the users page is typed against the user
 * DTO and one for the roles page against the role DTO.
 */
export type IdentityEntityPropContributors = Partial<{
  [IdentityComponents.Roles]: EntityPropContributorCallback<IdentityRoleDto>[];
  [IdentityComponents.Users]: EntityPropContributorCallback<IdentityUserDto>[];
}>;

export type IdentityFormPropContributors = Partial<{
  [IdentityComponents.Roles]: FormPropContributorCallback<IdentityRoleDto>[];
  [IdentityComponents.Users]: FormPropContributorCallback<IdentityUserDto>[];
}>;

export type IdentityEntityActionContributors = Partial<{
  [IdentityComponents.Roles]: EntityActionContributorCallback<IdentityRoleDto>[];
  [IdentityComponents.Users]: EntityActionContributorCallback<IdentityUserDto>[];
}>;

export type IdentityToolbarActionContributors = Partial<{
  [IdentityComponents.Roles]: ToolbarActionContributorCallback<readonly IdentityRoleDto[]>[];
  [IdentityComponents.Users]: ToolbarActionContributorCallback<readonly IdentityUserDto[]>[];
}>;

export const IDENTITY_ENTITY_PROP_CONTRIBUTORS = defineToken<IdentityEntityPropContributors>(
  'IDENTITY_ENTITY_PROP_CONTRIBUTORS',
);

export const IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS = defineToken<IdentityFormPropContributors>(
  'IDENTITY_CREATE_FORM_PROP_CONTRIBUTORS',
);

export const IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS = defineToken<IdentityFormPropContributors>(
  'IDENTITY_EDIT_FORM_PROP_CONTRIBUTORS',
);

export const IDENTITY_ENTITY_ACTION_CONTRIBUTORS = defineToken<IdentityEntityActionContributors>(
  'IDENTITY_ENTITY_ACTION_CONTRIBUTORS',
);

export const IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS = defineToken<IdentityToolbarActionContributors>(
  'IDENTITY_TOOLBAR_ACTION_CONTRIBUTORS',
);

/** What the users page offers its row and toolbar buttons. */
export interface UsersPageCommands {
  add(): void;
  edit(user: IdentityUserDto): Promise<void>;
  remove(user: IdentityUserDto): Promise<void>;
  managePermissions(user: IdentityUserDto): void;
}

export const USERS_PAGE = defineToken<UsersPageCommands>('USERS_PAGE');

/** What the roles page offers its row and toolbar buttons. */
export interface RolesPageCommands {
  add(): void;
  edit(role: IdentityRoleDto): Promise<void>;
  remove(role: IdentityRoleDto): Promise<void>;
  managePermissions(role: IdentityRoleDto): void;
}

export const ROLES_PAGE = defineToken<RolesPageCommands>('ROLES_PAGE');
