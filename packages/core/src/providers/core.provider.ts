import { collectFeatures, defineFeature, type Feature } from '../di/features';
import { makeEnvironmentProviders, type EnvironmentProviders } from '../di/provider';
import { resolveRootOptions, type AbpRootOptions } from '../models/root-options';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';

export type CoreFeature = Feature<'withOptions'>;

/**
 * Everything `@lsw-abpvue/core` puts in the root injector. Pass the features the
 * application needs; the ones it does not pass are dropped by the bundler.
 * @param features `withXxx()` results
 */
export function provideAbpCore(...features: CoreFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders(collectFeatures('provideAbpCore()', features));
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
