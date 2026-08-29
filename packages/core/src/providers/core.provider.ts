import { provideAppInitializer } from '../di/app-initializer';
import { collectFeatures, defineFeature, type Feature } from '../di/features';
import { makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '../di/provider';
import { provideAppSetup } from '../di/vue-bridge';
import { languageInterceptor } from '../interceptors/language.interceptor';
import { tenantInterceptor } from '../interceptors/tenant.interceptor';
import { timezoneInterceptor } from '../interceptors/timezone.interceptor';
import { xsrfInterceptor } from '../interceptors/xsrf.interceptor';
import type { AbpLocalization } from '../models/localization';
import { resolveRootOptions, type AbpRootOptions } from '../models/root-options';
import { LocalizationService } from '../services/localization.service';
import type { AbpNavItem } from '../models/nav';
import { HTTP_INTERCEPTORS } from '../tokens/http.token';
import { NAV_COMPARE_FN } from '../tokens/nav.token';
import { LOCALIZATIONS, REGISTER_LOCALE } from '../tokens/localization.token';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { getInitialData } from './initial-data';

export type CoreFeature = Feature<
  'withOptions' | 'withLocalizations' | 'withRegisterLocale' | 'withCompareFunc'
>;

/**
 * The interceptors every ABP request goes through, in the order they wrap it. The
 * authentication one is added by `@lsw-abpvue/oauth` and lands after these.
 */
function defaultInterceptors(): Provider[] {
  return [tenantInterceptor, languageInterceptor, timezoneInterceptor, xsrfInterceptor].map(
    useFactory => ({ provide: HTTP_INTERCEPTORS, multi: true, useFactory }) as Provider,
  );
}

/**
 * Everything `@lsw-abpvue/core` puts in the root injector. Pass the features the
 * application needs; the ones it does not pass are dropped by the bundler.
 * @param features `withXxx()` results
 */
export function provideAbpCore(...features: CoreFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...defaultInterceptors(),
    // `$t` is a plain function reading reactive state, so a template that used it
    // re-renders when the language changes -- no pipe and no remount (differences 4 and 6).
    provideAppSetup((app, injector) => {
      app.config.globalProperties.$t = (key, ...params) =>
        injector.get(LocalizationService).t(key, ...params);
    }),
    provideAppInitializer(getInitialData),
    // Last, so a feature overrides a default rather than the other way round.
    ...collectFeatures('provideAbpCore()', features),
  ]);
}

/**
 * The host's environment and the switches that go with it.
 * @param options Root options; every field but `environment` has a default
 */
export function withOptions(options: AbpRootOptions): CoreFeature {
  return defineFeature('withOptions', [
    { provide: ABP_ROOT_OPTIONS, useValue: resolveRootOptions(options) },
  ]);
}

/**
 * Texts shipped with the application, overriding the backend's for the same key. Every
 * package may contribute its own, so this one may be passed more than once.
 * @param localizations Texts per culture
 */
export function withLocalizations(localizations: AbpLocalization[]): CoreFeature {
  return defineFeature(
    'withLocalizations',
    // One provider per entry: the token collects `AbpLocalization`, not arrays of them.
    localizations.map(localization => ({
      provide: LOCALIZATIONS,
      multi: true as const,
      useValue: localization,
    })),
    { repeatable: true },
  );
}

/**
 * Orders siblings in every ABP tree — the menu, settings tabs, toolbar actions. The
 * default compares `order`.
 * @param fn Comparator over two nav items
 */
export function withCompareFunc(fn: (a: AbpNavItem, b: AbpNavItem) => number): CoreFeature {
  return defineFeature('withCompareFunc', [{ provide: NAV_COMPARE_FN, useValue: fn }]);
}

/**
 * Switches anything else that depends on the language -- a date library's locale, most
 * often. `Intl` needs nothing, so there is no default to replace.
 * @param fn Runs after the new culture's texts have been fetched
 */
export function withRegisterLocale(fn: (culture: string) => Promise<void>): CoreFeature {
  return defineFeature('withRegisterLocale', [{ provide: REGISTER_LOCALE, useValue: fn }]);
}
