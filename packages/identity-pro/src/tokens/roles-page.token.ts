import { defineToken } from '@lsw-abpvue/core';
import type { IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';

/** Commercial role operations available to contributed actions. */
export interface IdentityProRolesPageCommands {
  add(): void;
  edit(role: IdentityRoleDto): Promise<void>;
  remove(role: IdentityRoleDto): void;
  managePermissions(role: IdentityRoleDto): void;
  manageClaims(role: IdentityRoleDto): void;
  viewHistory(role: IdentityRoleDto): void;
  moveAllUsers(role: IdentityRoleDto): void;
}

export const IDENTITY_PRO_ROLES_PAGE =
  defineToken<IdentityProRolesPageCommands>('IDENTITY_PRO_ROLES_PAGE');
