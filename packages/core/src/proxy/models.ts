/**
 * The DTOs of ABP's framework endpoints, named exactly as the backend serialises them.
 * Hand-written until the proxy generator of M3 takes over, and kept in the shape the
 * generator will emit so the swap is a delete.
 */

import type { NameValue } from '../models/dtos.js';

export interface ApplicationConfigurationDto {
  localization: ApplicationLocalizationConfigurationDto;
  auth: ApplicationAuthConfigurationDto;
  setting: ApplicationSettingConfigurationDto;
  currentUser: CurrentUserDto;
  features: ApplicationFeatureConfigurationDto;
  globalFeatures: ApplicationGlobalFeatureConfigurationDto;
  multiTenancy: MultiTenancyInfoDto;
  currentTenant: CurrentTenantDto;
  timing: TimingDto;
  clock: ClockDto;
  objectExtensions: ObjectExtensionsDto;
  extraProperties: Record<string, unknown>;
}

export interface ApplicationConfigurationRequestOptions {
  includeLocalizationResources: boolean;
}

export interface ApplicationAuthConfigurationDto {
  grantedPolicies: Record<string, boolean>;
}

export interface ApplicationSettingConfigurationDto {
  values: Record<string, string>;
}

export interface ApplicationFeatureConfigurationDto {
  values: Record<string, string>;
}

export interface ApplicationGlobalFeatureConfigurationDto {
  enabledFeatures: string[];
}

export interface ApplicationLocalizationConfigurationDto {
  values: Record<string, Record<string, string>>;
  resources: Record<string, ApplicationLocalizationResourceDto>;
  languages: LanguageInfo[];
  currentCulture: CurrentCultureDto;
  defaultResourceName?: string | null;
  languagesMap: Record<string, NameValue[]>;
  languageFilesMap: Record<string, NameValue[]>;
  useRouteBasedCulture: boolean;
}

export interface ApplicationLocalizationDto {
  resources: Record<string, ApplicationLocalizationResourceDto>;
  currentCulture: CurrentCultureDto;
}

export interface ApplicationLocalizationRequestDto {
  cultureName: string;
  onlyDynamics: boolean;
}

export interface ApplicationLocalizationResourceDto {
  texts: Record<string, string>;
  baseResources: string[];
}

export interface LanguageInfo {
  cultureName?: string;
  uiCultureName?: string;
  displayName?: string;
  twoLetterISOLanguageName?: string;
}

export interface CurrentCultureDto {
  displayName?: string;
  englishName?: string;
  threeLetterIsoLanguageName?: string;
  twoLetterIsoLanguageName?: string;
  isRightToLeft: boolean;
  cultureName?: string;
  name?: string;
  nativeName?: string;
  dateTimeFormat: DateTimeFormatDto;
}

export interface DateTimeFormatDto {
  calendarAlgorithmType?: string;
  dateTimeFormatLong?: string;
  shortDatePattern?: string;
  fullDateTimePattern?: string;
  dateSeparator?: string;
  shortTimePattern?: string;
  longTimePattern?: string;
}

export interface CurrentUserDto {
  isAuthenticated: boolean;
  sessionId?: string | null;
  id?: string | null;
  tenantId?: string | null;
  impersonatorUserId?: string | null;
  impersonatorTenantId?: string | null;
  impersonatorUserName?: string | null;
  impersonatorTenantName?: string | null;
  userName?: string | null;
  name?: string | null;
  surName?: string | null;
  email?: string | null;
  emailVerified: boolean;
  phoneNumber?: string | null;
  phoneNumberVerified: boolean;
  roles: string[];
}

export interface CurrentTenantDto {
  id?: string | null;
  name?: string | null;
  isAvailable: boolean;
}

export interface MultiTenancyInfoDto {
  isEnabled: boolean;
  userSharingStrategy?: number;
}

export interface FindTenantResultDto {
  success: boolean;
  tenantId?: string | null;
  name?: string | null;
  normalizedName?: string | null;
  isActive: boolean;
}

export interface TimingDto {
  timeZone: TimeZone;
}

export interface TimeZone {
  iana: IanaTimeZone;
  windows: WindowsTimeZone;
}

export interface IanaTimeZone {
  timeZoneName?: string | null;
}

export interface WindowsTimeZone {
  timeZoneId?: string | null;
}

export interface ClockDto {
  kind?: string;
}

export interface ObjectExtensionsDto {
  modules: Record<string, ModuleExtensionDto>;
  enums: Record<string, ExtensionEnumDto>;
}

export interface ModuleExtensionDto {
  entities: Record<string, EntityExtensionDto>;
  configuration: Record<string, unknown>;
}

export interface EntityExtensionDto {
  properties: Record<string, ExtensionPropertyDto>;
  configuration: Record<string, unknown>;
}

export interface ExtensionPropertyDto {
  type?: string;
  typeSimple?: string;
  displayName: LocalizableStringDto | null;
  api: ExtensionPropertyApiDto;
  ui: ExtensionPropertyUiDto;
  policy?: ExtensionPropertyPolicyDto;
  attributes: ExtensionPropertyAttributeDto[];
  configuration: Record<string, unknown>;
  defaultValue: unknown;
  /** Help text under a form field. Declared by ABP's UI model, not sent by the backend. */
  formText?: string;
}

export interface ExtensionPropertyPolicyDto {
  globalFeatures: ExtensionPropertyFeaturePolicyDto;
  features: ExtensionPropertyFeaturePolicyDto;
  permissions: ExtensionPropertyPermissionPolicyDto;
}

export interface ExtensionPropertyFeaturePolicyDto {
  features?: string[];
  requiresAll: boolean;
}

export interface ExtensionPropertyPermissionPolicyDto {
  permissionNames?: string[];
  requiresAll: boolean;
}

export interface ExtensionPropertyApiDto {
  onGet: { isAvailable: boolean };
  onCreate: { isAvailable: boolean };
  onUpdate: { isAvailable: boolean };
}

export interface ExtensionPropertyUiDto {
  /** `isSortable` is declared by ABP's UI model; the backend does not send it yet. */
  onTable: { isVisible: boolean; isSortable?: boolean };
  onCreateForm: { isVisible: boolean };
  onEditForm: { isVisible: boolean };
  lookup?: ExtensionPropertyUiLookupDto;
}

export interface ExtensionPropertyUiLookupDto {
  url?: string;
  resultListPropertyName?: string;
  displayPropertyName?: string;
  valuePropertyName?: string;
  filterParamName?: string;
}

export interface ExtensionPropertyAttributeDto {
  typeSimple?: string;
  config: Record<string, unknown>;
}

export interface ExtensionEnumDto {
  fields: ExtensionEnumFieldDto[];
  localizationResource?: string | null;
}

export interface ExtensionEnumFieldDto {
  name?: string | null;
  value: unknown;
}

export interface LocalizableStringDto {
  name?: string;
  resource?: string | null;
}
