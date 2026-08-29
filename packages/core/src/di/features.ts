import { DuplicateFeatureError } from './errors';
import type { Provider } from './provider';

/**
 * One `withXxx()` option of a `provideXxx()` call. Features are values rather than
 * fields of an options object so that the ones an application does not use can be
 * shaken out of its bundle.
 */
export interface Feature<K extends string = string> {
  readonly ɵkind: K;
  readonly ɵproviders: readonly Provider[];
  readonly ɵrepeatable: boolean;
}

/**
 * Defines a `withXxx()` feature.
 * @param kind Identity of the feature, unique within its package
 * @param providers What the feature contributes
 * @param options `repeatable` for features that add to a multi token and may be passed
 * more than once
 */
export function defineFeature<K extends string>(
  kind: K,
  providers: readonly Provider[],
  options: { repeatable?: boolean | undefined } = {},
): Feature<K> {
  return { ɵkind: kind, ɵproviders: providers, ɵrepeatable: options.repeatable ?? false };
}

/**
 * Flattens the features of one `provideXxx()` call, rejecting a repeated feature rather
 * than letting the last one quietly win.
 * @param source Name of the calling provider function, for the error message
 * @param features Features as passed by the application
 */
export function collectFeatures(source: string, features: readonly Feature[]): Provider[] {
  const seen = new Set<string>();
  const providers: Provider[] = [];

  for (const feature of features) {
    if (!feature.ɵrepeatable && seen.has(feature.ɵkind)) {
      throw new DuplicateFeatureError(source, feature.ɵkind);
    }
    seen.add(feature.ɵkind);
    providers.push(...feature.ɵproviders);
  }

  return providers;
}
