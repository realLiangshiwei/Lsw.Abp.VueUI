import type {
  ExtensibleEntityDto,
  ExtensibleFullAuditedEntityDto,
  ExtensibleObject,
  ExtensiblePagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';

export interface GetIdentityRolesInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface GetIdentityUsersInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export type IdentityRoleCreateDto = IdentityRoleCreateOrUpdateDtoBase;

export interface IdentityRoleCreateOrUpdateDtoBase extends ExtensibleObject {
  name: string;
  isDefault?: boolean | undefined;
  isPublic?: boolean | undefined;
}

export interface IdentityRoleDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  isDefault?: boolean | undefined;
  isStatic?: boolean | undefined;
  isPublic?: boolean | undefined;
  concurrencyStamp?: string | undefined;
  creationTime?: string | undefined;
}

export interface IdentityRoleUpdateDto extends IdentityRoleCreateOrUpdateDtoBase {
  concurrencyStamp?: string | undefined;
}

export interface IdentityUserCreateDto extends IdentityUserCreateOrUpdateDtoBase {
  password: string;
}

export interface IdentityUserCreateOrUpdateDtoBase extends ExtensibleObject {
  userName: string;
  name?: string | undefined;
  surname?: string | undefined;
  email: string;
  phoneNumber?: string | undefined;
  isActive?: boolean | undefined;
  lockoutEnabled?: boolean | undefined;
  roleNames?: string[] | undefined;
}

export interface IdentityUserDto extends ExtensibleFullAuditedEntityDto<string> {
  tenantId?: string | null | undefined;
  userName?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  email?: string | undefined;
  emailConfirmed?: boolean | undefined;
  phoneNumber?: string | undefined;
  phoneNumberConfirmed?: boolean | undefined;
  isActive?: boolean | undefined;
  lockoutEnabled?: boolean | undefined;
  accessFailedCount?: number | undefined;
  lockoutEnd?: string | null | undefined;
  concurrencyStamp?: string | undefined;
  entityVersion?: number | undefined;
  lastPasswordChangeTime?: string | null | undefined;
}

export interface IdentityUserUpdateDto extends IdentityUserCreateOrUpdateDtoBase {
  password?: string | undefined;
  concurrencyStamp?: string | undefined;
}

export interface IdentityUserUpdateRolesDto {
  roleNames: string[];
}

export interface UserLookupCountInputDto {
  filter?: string | undefined;
}

export interface UserLookupSearchInputDto extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
}
