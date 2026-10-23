import type {
  ExtensibleCreationAuditedEntityDto,
  ExtensibleObject,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';

export interface CreateLanguageDto extends ExtensibleObject {
  displayName?: string | undefined;
  cultureName?: string | undefined;
  uiCultureName?: string | undefined;
  isEnabled?: boolean | undefined;
}

export interface CultureInfoDto {
  displayName?: string | undefined;
  name?: string | undefined;
}

export interface GetLanguagesTextsInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
  resourceName?: string | undefined;
  baseCultureName?: string | undefined;
  targetCultureName?: string | undefined;
  getOnlyEmptyValues?: boolean | undefined;
}

export interface LanguageDto extends ExtensibleCreationAuditedEntityDto<string> {
  cultureName?: string | undefined;
  uiCultureName?: string | undefined;
  displayName?: string | undefined;
  isEnabled: boolean;
  isDefaultLanguage: boolean;
  concurrencyStamp?: string | undefined;
}

export interface LanguageResourceDto {
  name?: string | undefined;
}

export interface LanguageTextDto {
  resourceName?: string | undefined;
  cultureName?: string | undefined;
  baseCultureName?: string | undefined;
  baseValue?: string | undefined;
  name?: string | undefined;
  value?: string | undefined;
}

export interface UpdateLanguageDto extends ExtensibleObject {
  displayName?: string | undefined;
  isEnabled?: boolean | undefined;
  concurrencyStamp?: string | undefined;
}
