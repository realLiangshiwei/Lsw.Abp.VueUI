import type {
  ExtensibleEntityDto,
  ExtensibleObject,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';
import type { TenantActivationState } from '../../tenant-activation-state.enum.js';

export type EditionCreateDto = EditionCreateOrUpdateDtoBase;

export interface EditionCreateOrUpdateDtoBase extends ExtensibleObject {
  displayName: string;
  planId?: string | null | undefined;
}

export interface EditionDto extends ExtensibleEntityDto<string> {
  displayName?: string | undefined;
  planId?: string | null | undefined;
  planName?: string | undefined;
  concurrencyStamp?: string | undefined;
  tenantCount: number;
}

export interface EditionLookupDto extends ExtensibleEntityDto<string> {
  displayName?: string | undefined;
}

export interface EditionUpdateDto extends EditionCreateOrUpdateDtoBase {
  concurrencyStamp?: string | undefined;
}

export interface GetEditionsInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface GetTenantsInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
  getEditionNames?: boolean | undefined;
  editionId?: string | null | undefined;
  expirationDateMin?: string | null | undefined;
  expirationDateMax?: string | null | undefined;
  activationState?: TenantActivationState | null | undefined;
  activationEndDateMin?: string | null | undefined;
  activationEndDateMax?: string | null | undefined;
}

export interface SaasHostSettingDto {
  enableTenantBasedConnectionStringManagement?: boolean | undefined;
}

export interface SaasTenantConnectionStringsDto extends ExtensibleEntityDto {
  default?: string | undefined;
  databases?: SaasTenantDatabaseConnectionStringsDto[] | undefined;
}

export interface SaasTenantCreateDto extends SaasTenantCreateOrUpdateDtoBase {
  adminEmailAddress: string;
  adminPassword?: string | undefined;
  connectionStrings?: SaasTenantConnectionStringsDto | undefined;
}

export interface SaasTenantCreateOrUpdateDtoBase extends ExtensibleObject {
  name: string;
  editionId?: string | null | undefined;
  activationState?: TenantActivationState | undefined;
  activationEndDate?: string | null | undefined;
  editionEndDateUtc?: string | null | undefined;
}

export interface SaasTenantDatabaseConnectionStringsDto extends ExtensibleEntityDto {
  databaseName?: string | undefined;
  connectionString?: string | undefined;
}

export interface SaasTenantDatabasesDto extends ExtensibleEntityDto {
  databases?: string[] | undefined;
}

export interface SaasTenantDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  editionId?: string | null | undefined;
  editionEndDateUtc?: string | null | undefined;
  editionName?: string | undefined;
  hasDefaultConnectionString: boolean;
  activationState: TenantActivationState;
  activationEndDate?: string | null | undefined;
  concurrencyStamp?: string | undefined;
}

export interface SaasTenantInviteUserDto {
  email: string;
}

export interface SaasTenantSetPasswordDto {
  username?: string | undefined;
  password?: string | undefined;
}

export interface SaasTenantUpdateDto extends SaasTenantCreateOrUpdateDtoBase {
  concurrencyStamp?: string | undefined;
}
