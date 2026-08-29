export { APP_INITIALIZERS, provideAppInitializer } from './di/app-initializer';
export type { AppInitializer } from './di/app-initializer';
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
export { createAbpApp, provideAbp } from './di/vue-bridge';
export type { AbpApp, CreateAbpAppOptions } from './di/vue-bridge';
