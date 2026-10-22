import type { NameValue } from '@lsw-abpvue/core';

export interface ExternalProviderDto {
  providers?: ExternalProviderItemDto[] | undefined;
}

export interface ExternalProviderItemDto {
  name?: string | undefined;
  enabled: boolean;
  properties?: ExternalProviderSettingsProperty[] | undefined;
}

export interface ExternalProviderItemWithSecretDto {
  success: boolean;
  name?: string | undefined;
  enabled: boolean;
  enabledForTenantUser: boolean;
  properties?: ExternalProviderSettingsProperty[] | undefined;
  secretProperties?: ExternalProviderSettingsProperty[] | undefined;
}

export interface ExternalProviderSettings {
  name?: string | undefined;
  enabled?: boolean | undefined;
  enabledForTenantUser?: boolean | undefined;
  useCustomSettings?: boolean | undefined;
  properties?: ExternalProviderSettingsProperty[] | undefined;
  secretProperties?: ExternalProviderSettingsProperty[] | undefined;
}

export type ExternalProviderSettingsProperty = NameValue<string>;

export interface GetByNameInput {
  tenantId?: string | null | undefined;
  name?: string | undefined;
}
