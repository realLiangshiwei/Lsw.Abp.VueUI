export interface EntityExtensionDto {
  properties?: Record<string, ExtensionPropertyDto> | undefined;
  configuration?: Record<string, unknown> | undefined;
}

export interface ExtensionEnumDto {
  fields?: ExtensionEnumFieldDto[] | undefined;
  localizationResource?: string | null | undefined;
}

export interface ExtensionEnumFieldDto {
  name?: string | null | undefined;
  value?: unknown | null | undefined;
}

export interface ExtensionPropertyApiCreateDto {
  isAvailable: boolean;
}

export interface ExtensionPropertyApiDto {
  onGet?: ExtensionPropertyApiGetDto | undefined;
  onCreate?: ExtensionPropertyApiCreateDto | undefined;
  onUpdate?: ExtensionPropertyApiUpdateDto | undefined;
}

export interface ExtensionPropertyApiGetDto {
  isAvailable: boolean;
}

export interface ExtensionPropertyApiUpdateDto {
  isAvailable: boolean;
}

export interface ExtensionPropertyAttributeDto {
  typeSimple?: string | undefined;
  config?: Record<string, unknown> | undefined;
}

export interface ExtensionPropertyDto {
  type?: string | undefined;
  typeSimple?: string | undefined;
  displayName?: LocalizableStringDto | null | undefined;
  api?: ExtensionPropertyApiDto | undefined;
  ui?: ExtensionPropertyUiDto | undefined;
  policy?: ExtensionPropertyPolicyDto | undefined;
  attributes?: ExtensionPropertyAttributeDto[] | undefined;
  configuration?: Record<string, unknown> | undefined;
  defaultValue?: unknown | null | undefined;
}

export interface ExtensionPropertyFeaturePolicyDto {
  features?: string[] | undefined;
  requiresAll: boolean;
}

export interface ExtensionPropertyGlobalFeaturePolicyDto {
  features?: string[] | undefined;
  requiresAll: boolean;
}

export interface ExtensionPropertyPermissionPolicyDto {
  permissionNames?: string[] | undefined;
  requiresAll: boolean;
}

export interface ExtensionPropertyPolicyDto {
  globalFeatures?: ExtensionPropertyGlobalFeaturePolicyDto | undefined;
  features?: ExtensionPropertyFeaturePolicyDto | undefined;
  permissions?: ExtensionPropertyPermissionPolicyDto | undefined;
}

export interface ExtensionPropertyUiDto {
  onTable?: ExtensionPropertyUiTableDto | undefined;
  onCreateForm?: ExtensionPropertyUiFormDto | undefined;
  onEditForm?: ExtensionPropertyUiFormDto | undefined;
  lookup?: ExtensionPropertyUiLookupDto | undefined;
}

export interface ExtensionPropertyUiFormDto {
  isVisible: boolean;
}

export interface ExtensionPropertyUiLookupDto {
  url?: string | undefined;
  resultListPropertyName?: string | undefined;
  displayPropertyName?: string | undefined;
  valuePropertyName?: string | undefined;
  filterParamName?: string | undefined;
}

export interface ExtensionPropertyUiTableDto {
  isVisible: boolean;
}

export interface LocalizableStringDto {
  name?: string | undefined;
  resource?: string | null | undefined;
}

export interface ModuleExtensionDto {
  entities?: Record<string, EntityExtensionDto> | undefined;
  configuration?: Record<string, unknown> | undefined;
}

export interface ObjectExtensionsDto {
  modules?: Record<string, ModuleExtensionDto> | undefined;
  enums?: Record<string, ExtensionEnumDto> | undefined;
}
