export interface GetPermissionListResultDto {
  entityDisplayName?: string | undefined;
  groups?: PermissionGroupDto[] | undefined;
}

export interface GetResourcePermissionDefinitionListResultDto {
  permissions?: ResourcePermissionDefinitionDto[] | undefined;
}

export interface GetResourcePermissionListResultDto {
  permissions?: ResourcePermissionGrantInfoDto[] | undefined;
}

export interface GetResourcePermissionWithProviderListResultDto {
  permissions?: ResourcePermissionWithProdiverGrantInfoDto[] | undefined;
}

export interface GetResourceProviderListResultDto {
  providers?: ResourceProviderDto[] | undefined;
}

export interface GrantedResourcePermissionDto {
  name?: string | undefined;
  displayName?: string | undefined;
}

export interface PermissionGrantInfoDto {
  name?: string | undefined;
  displayName?: string | undefined;
  parentName?: string | undefined;
  isGranted: boolean;
  allowedProviders?: string[] | undefined;
  grantedProviders?: ProviderInfoDto[] | undefined;
  isEditable: boolean;
}

export interface PermissionGroupDto {
  name?: string | undefined;
  displayName?: string | undefined;
  displayNameKey?: string | undefined;
  displayNameResource?: string | undefined;
  permissions?: PermissionGrantInfoDto[] | undefined;
}

export interface ProviderInfoDto {
  providerName?: string | undefined;
  providerKey?: string | undefined;
}

export interface ResourcePermissionDefinitionDto {
  name?: string | undefined;
  displayName?: string | undefined;
}

export interface ResourcePermissionGrantInfoDto {
  providerName?: string | undefined;
  providerKey?: string | undefined;
  providerDisplayName?: string | undefined;
  providerNameDisplayName?: string | undefined;
  permissions?: GrantedResourcePermissionDto[] | undefined;
}

export interface ResourcePermissionWithProdiverGrantInfoDto {
  name?: string | undefined;
  displayName?: string | undefined;
  providers?: string[] | undefined;
  isGranted: boolean;
}

export interface ResourceProviderDto {
  name?: string | undefined;
  displayName?: string | undefined;
}

export interface SearchProviderKeyInfo {
  providerKey?: string | undefined;
  providerDisplayName?: string | undefined;
}

export interface SearchProviderKeyListResultDto {
  keys?: SearchProviderKeyInfo[] | undefined;
}

export interface UpdatePermissionDto {
  name?: string | undefined;
  isGranted?: boolean | undefined;
}

export interface UpdatePermissionsDto {
  permissions?: UpdatePermissionDto[] | undefined;
}

export interface UpdateResourcePermissionsDto {
  providerName?: string | undefined;
  providerKey?: string | undefined;
  permissions?: string[] | undefined;
}
