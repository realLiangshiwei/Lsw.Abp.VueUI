import type { InjectionToken } from './token';

/**
 * The element type of a multi token: `InjectionToken<Interceptor[]>` is provided one
 * `Interceptor` at a time. Non-array tokens are left alone.
 */
export type MultiValue<T> = [T] extends [readonly (infer E)[]] ? E : T;

interface Replaces<T> {
  provide: InjectionToken<T>;
  multi?: false | undefined;
}

interface Appends<T> {
  provide: InjectionToken<T>;
  multi: true;
}

export type ValueProvider<T = unknown> =
  (Replaces<T> & { useValue: T }) | (Appends<T> & { useValue: MultiValue<T> });

export type ClassProvider<T = unknown> =
  (Replaces<T> & { useClass: new () => T }) | (Appends<T> & { useClass: new () => MultiValue<T> });

export type FactoryProvider<T = unknown> =
  (Replaces<T> & { useFactory: () => T }) | (Appends<T> & { useFactory: () => MultiValue<T> });

export type ExistingProvider<T = unknown> =
  | (Replaces<T> & { useExisting: InjectionToken<T> })
  | (Appends<T> & { useExisting: InjectionToken<MultiValue<T>> });

export type Provider<T = unknown> =
  ValueProvider<T> | ClassProvider<T> | FactoryProvider<T> | ExistingProvider<T>;

/**
 * Providers that only make sense at the root of an application. The wrapper is opaque
 * on purpose: it keeps a `provideXxx()` result out of a component-level `provideAbp()`,
 * where half of it would silently do nothing.
 */
export interface EnvironmentProviders {
  readonly ɵproviders: readonly ProviderInput[];
}

export type ProviderInput = Provider | EnvironmentProviders;

/**
 * Wraps a package's providers so they can only be passed to `createAbpApp`.
 * @param providers Providers the package needs at application scope
 */
export function makeEnvironmentProviders(
  providers: readonly ProviderInput[],
): EnvironmentProviders {
  return { ɵproviders: providers };
}

function isEnvironmentProviders(value: ProviderInput): value is EnvironmentProviders {
  return 'ɵproviders' in value;
}

/** Flattens nested `EnvironmentProviders` into the plain list the injector records. */
export function flattenProviders(providers: readonly ProviderInput[]): Provider[] {
  const flat: Provider[] = [];

  for (const entry of providers) {
    if (isEnvironmentProviders(entry)) flat.push(...flattenProviders(entry.ɵproviders));
    else flat.push(entry);
  }

  return flat;
}
