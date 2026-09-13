import type { NameValue } from '@lsw-abpvue/core';
import type { LanguageInfo } from '../../../localization/models.js';
import type { CurrentTenantDto, MultiTenancyInfoDto } from '../multi-tenancy/models.js';
import type { ObjectExtensionsDto } from './object-extending/models.js';

export interface ApplicationAuthConfigurationDto {
  grantedPolicies?: Record<string, boolean> | undefined;
}

export interface ApplicationConfigurationDto {
  localization?: ApplicationLocalizationConfigurationDto | undefined;
  auth?: ApplicationAuthConfigurationDto | undefined;
  setting?: ApplicationSettingConfigurationDto | undefined;
  currentUser?: CurrentUserDto | undefined;
  features?: ApplicationFeatureConfigurationDto | undefined;
  globalFeatures?: ApplicationGlobalFeatureConfigurationDto | undefined;
  multiTenancy?: MultiTenancyInfoDto | undefined;
  currentTenant?: CurrentTenantDto | undefined;
  timing?: TimingDto | undefined;
  clock?: ClockDto | undefined;
  objectExtensions?: ObjectExtensionsDto | undefined;
  extraProperties?: Record<string, unknown> | undefined;
}

export interface ApplicationConfigurationRequestOptions {
  includeLocalizationResources?: boolean | undefined;
}

export interface ApplicationFeatureConfigurationDto {
  values?: Record<string, string> | undefined;
}

export interface ApplicationGlobalFeatureConfigurationDto {
  enabledFeatures?: string[] | undefined;
}

export interface ApplicationLocalizationConfigurationDto {
  values?: Record<string, Record<string, string>> | undefined;
  resources?: Record<string, ApplicationLocalizationResourceDto> | undefined;
  languages?: LanguageInfo[] | undefined;
  currentCulture?: CurrentCultureDto | undefined;
  defaultResourceName?: string | null | undefined;
  languagesMap?: Record<string, NameValue[]> | undefined;
  languageFilesMap?: Record<string, NameValue[]> | undefined;
  useRouteBasedCulture?: boolean | undefined;
}

export interface ApplicationLocalizationDto {
  resources?: Record<string, ApplicationLocalizationResourceDto> | undefined;
  currentCulture?: CurrentCultureDto | undefined;
}

export interface ApplicationLocalizationRequestDto {
  cultureName: string;
  onlyDynamics?: boolean | undefined;
}

export interface ApplicationLocalizationResourceDto {
  texts?: Record<string, string> | undefined;
  baseResources?: string[] | undefined;
}

export interface ApplicationSettingConfigurationDto {
  values?: Record<string, string> | undefined;
}

export interface ClockDto {
  kind?: string | undefined;
}

export interface CurrentCultureDto {
  displayName?: string | undefined;
  englishName?: string | undefined;
  threeLetterIsoLanguageName?: string | undefined;
  twoLetterIsoLanguageName?: string | undefined;
  isRightToLeft?: boolean | undefined;
  cultureName?: string | undefined;
  name?: string | undefined;
  nativeName?: string | undefined;
  dateTimeFormat?: DateTimeFormatDto | undefined;
}

export interface CurrentUserDto {
  isAuthenticated?: boolean | undefined;
  id?: string | null | undefined;
  tenantId?: string | null | undefined;
  impersonatorUserId?: string | null | undefined;
  impersonatorTenantId?: string | null | undefined;
  impersonatorUserName?: string | null | undefined;
  impersonatorTenantName?: string | null | undefined;
  userName?: string | null | undefined;
  name?: string | null | undefined;
  surName?: string | null | undefined;
  email?: string | null | undefined;
  emailVerified?: boolean | undefined;
  phoneNumber?: string | null | undefined;
  phoneNumberVerified?: boolean | undefined;
  roles?: string[] | undefined;
  sessionId?: string | null | undefined;
}

export interface DateTimeFormatDto {
  calendarAlgorithmType?: string | undefined;
  dateTimeFormatLong?: string | undefined;
  shortDatePattern?: string | undefined;
  fullDateTimePattern?: string | undefined;
  dateSeparator?: string | undefined;
  shortTimePattern?: string | undefined;
  longTimePattern?: string | undefined;
}

export interface IanaTimeZone {
  timeZoneName?: string | null | undefined;
}

export interface TimeZone {
  iana?: IanaTimeZone | undefined;
  windows?: WindowsTimeZone | undefined;
}

export interface TimingDto {
  timeZone?: TimeZone | undefined;
}

export interface WindowsTimeZone {
  timeZoneId?: string | null | undefined;
}
