import type {
  ExtensibleEntityDto,
  ExtensibleObject,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';

export interface GetTenantsInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface TenantCreateDto extends TenantCreateOrUpdateDtoBase {
  adminEmailAddress: string;
  adminPassword: string;
}

export interface TenantCreateOrUpdateDtoBase extends ExtensibleObject {
  name: string;
}

export interface TenantDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  concurrencyStamp?: string | undefined;
}

export interface TenantUpdateDto extends TenantCreateOrUpdateDtoBase {
  concurrencyStamp?: string | undefined;
}
