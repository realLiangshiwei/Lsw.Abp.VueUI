import { provideAppInitializer } from '../di/app-initializer';
import { collectFeatures, defineFeature, type Feature } from '../di/features';
import { makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '../di/provider';
import { languageInterceptor } from '../interceptors/language.interceptor';
import { tenantInterceptor } from '../interceptors/tenant.interceptor';
import { timezoneInterceptor } from '../interceptors/timezone.interceptor';
import { xsrfInterceptor } from '../interceptors/xsrf.interceptor';
import { resolveRootOptions, type AbpRootOptions } from '../models/root-options';
import { HTTP_INTERCEPTORS } from '../tokens/http.token';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { getInitialData } from './initial-data';

export type CoreFeature = Feature<'withOptions'>;

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
