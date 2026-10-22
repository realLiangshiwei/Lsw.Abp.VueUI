import { defineToken } from '@lsw-abpvue/core';
import type {
  IdentityRoleDto,
  IdentityUserDto,
  OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';

/** Organization unit operations available to contributed actions. */
export interface OrganizationUnitsPageCommands {
  add(parent?: OrganizationUnitWithDetailsDto | undefined): void;
  edit(unit: OrganizationUnitWithDetailsDto): Promise<void>;
  move(unit: OrganizationUnitWithDetailsDto): void;
  remove(unit: OrganizationUnitWithDetailsDto): void;
  moveAllUsers(unit: OrganizationUnitWithDetailsDto): void;
}

/** Membership operations available to contributed actions. */
export interface OrganizationMembersCommands {
  remove(member: IdentityUserDto): Promise<void>;
}

/** Role assignment operations available to contributed actions. */
export interface OrganizationRolesCommands {
  remove(role: IdentityRoleDto): Promise<void>;
}

export const ORGANIZATION_UNITS_PAGE =
  defineToken<OrganizationUnitsPageCommands>('ORGANIZATION_UNITS_PAGE');
export const ORGANIZATION_MEMBERS =
  defineToken<OrganizationMembersCommands>('ORGANIZATION_MEMBERS');
export const ORGANIZATION_ROLES = defineToken<OrganizationRolesCommands>('ORGANIZATION_ROLES');
