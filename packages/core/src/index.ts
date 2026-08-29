export {
  APP_INIT_ERROR_HANDLERS,
  APP_INITIALIZERS,
  provideAppInitErrorHandler,
  provideAppInitializer,
} from './di/app-initializer';
export type { AppInitErrorHandler, AppInitializer } from './di/app-initializer';
export {
  AbpDiError,
  CircularDependencyError,
  DuplicateFeatureError,
  InjectorDestroyedError,
  InvalidProviderError,
  MultiProviderMismatchError,
  NullInjectorError,
  OutsideInjectionContextError,
} from './di/errors';
export { collectFeatures, defineFeature } from './di/features';
export type { Feature } from './di/features';
export { ABP_INJECTOR_KEY, getCurrentInjector, inject, runInInjectionContext } from './di/inject';
export { createInjector, onServiceDestroy } from './di/injector';
export type { InjectOptions, Injector } from './di/injector';
export { makeEnvironmentProviders } from './di/provider';
export type {
  ClassProvider,
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  MultiValue,
  Provider,
  ProviderInput,
  ValueProvider,
} from './di/provider';
export { defineService, defineToken } from './di/token';
export type { InjectionToken, ServiceOf, TokenOptions } from './di/token';
export { APP_SETUP_HOOKS, createAbpApp, provideAbp, provideAppSetup } from './di/vue-bridge';
export type { AbpApp, AppSetupHook, CreateAbpAppOptions } from './di/vue-bridge';

export { default as AbpPermission } from './components/AbpPermission.vue';

export { languageInterceptor } from './interceptors/language.interceptor';
export { tenantInterceptor } from './interceptors/tenant.interceptor';
export { timezoneInterceptor } from './interceptors/timezone.interceptor';
export { xsrfInterceptor } from './interceptors/xsrf.interceptor';

export type {
  ApiConfig,
  Apis,
  ApplicationInfo,
  Environment,
  OAuthConfig,
  RemoteEnv,
} from './models/environment';
export { AbpHttpError } from './models/http';
export type {
  AbpErrorEnvelope,
  AbpHttpErrorInit,
  HttpInterceptor,
  HttpRequestConfig,
  HttpResponse,
  RestConfig,
} from './models/http';
export type {
  AbpLocalization,
  LocalizationParam,
  LocalizationWithDefault,
} from './models/localization';
export type { AbpRootOptions, ResolvedRootOptions } from './models/root-options';

export {
  provideAbpCore,
  withLocalizations,
  withOptions,
  withRegisterLocale,
} from './providers/core.provider';
export type { CoreFeature } from './providers/core.provider';
export { getInitialData } from './providers/initial-data';

export { AbpApplicationConfigurationService } from './proxy/abp-application-configuration.service';
export { AbpApplicationLocalizationService } from './proxy/abp-application-localization.service';
export { AbpTenantService } from './proxy/abp-tenant.service';
export type {
  ApplicationAuthConfigurationDto,
  ApplicationConfigurationDto,
  ApplicationConfigurationRequestOptions,
  ApplicationFeatureConfigurationDto,
  ApplicationGlobalFeatureConfigurationDto,
  ApplicationLocalizationConfigurationDto,
  ApplicationLocalizationDto,
  ApplicationLocalizationRequestDto,
  ApplicationLocalizationResourceDto,
  ApplicationSettingConfigurationDto,
  ClockDto,
  CurrentCultureDto,
  CurrentTenantDto,
  CurrentUserDto,
  DateTimeFormatDto,
  EntityExtensionDto,
  ExtensionEnumDto,
  ExtensionEnumFieldDto,
  ExtensionPropertyApiDto,
  ExtensionPropertyAttributeDto,
  ExtensionPropertyDto,
  ExtensionPropertyUiDto,
  ExtensionPropertyUiLookupDto,
  FindTenantResultDto,
  IanaTimeZone,
  LanguageInfo,
  LocalizableStringDto,
  ModuleExtensionDto,
  MultiTenancyInfoDto,
  NameValue,
  ObjectExtensionsDto,
  TimeZone,
  TimingDto,
  WindowsTimeZone,
} from './proxy/models';

export { ConfigStateService, useConfigState } from './services/config-state.service';
export { CurrentUserService, useCurrentUser } from './services/current-user.service';
export { EnvironmentService, useEnvironment } from './services/environment.service';
export { HttpClient } from './services/http-client.service';
export {
  HttpErrorReporterService,
  useHttpErrorReporter,
} from './services/http-error-reporter.service';
export { FeatureService, useFeature } from './services/feature.service';
export { HttpWaitService, useHttpWait } from './services/http-wait.service';
export { LocalizationService, useLocalization } from './services/localization.service';
export { MultiTenancyService, useMultiTenancy } from './services/multi-tenancy.service';
export { PermissionService, usePermission } from './services/permission.service';
export { CookieService } from './services/platform/cookie.service';
export type { CookieOptions } from './services/platform/cookie.service';
export { DocumentService } from './services/platform/document.service';
export { StorageService } from './services/platform/storage.service';
export { WindowService } from './services/platform/window.service';
export { RestService, useRest } from './services/rest.service';
export { SessionStateService, useSessionState } from './services/session-state.service';
export type { SessionState } from './services/session-state.service';
export { SettingService, useSetting } from './services/setting.service';

export { HTTP_FETCH, HTTP_INTERCEPTORS } from './tokens/http.token';
export type { FetchLike } from './tokens/http.token';
export { LOCALIZATIONS, REGISTER_LOCALE } from './tokens/localization.token';
export { ABP_ROOT_OPTIONS } from './tokens/root-options.token';
export { TENANT_KEY } from './tokens/tenant-key.token';

export { InternalStore } from './utils/internal-store';
export { useDebounceFn } from './utils/use-debounce-fn';
export type { DebouncedFn } from './utils/use-debounce-fn';
export { useLatest } from './utils/use-latest';
export { useSubscriptions } from './utils/use-subscriptions';
export type { Subscriptions } from './utils/use-subscriptions';
