import type {
  ExtensibleEntityDto,
  ExtensibleObject,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';

export type CreateScopeInput = ScopeCreateOrUpdateDtoBase;

export interface GetScopeListInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface ScopeCreateOrUpdateDtoBase extends ExtensibleObject {
  name: string;
  displayName?: string | undefined;
  description?: string | undefined;
  resources?: string[] | undefined;
}

export interface ScopeDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  displayName?: string | undefined;
  description?: string | undefined;
  buildIn: boolean;
  resources?: string[] | undefined;
}

export type UpdateScopeInput = ScopeCreateOrUpdateDtoBase;
