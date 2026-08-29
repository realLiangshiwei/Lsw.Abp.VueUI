/**
 * The identity of an injectable value. Tokens are compared by their symbol, never by
 * name, so two packages can describe different things with the same words.
 */
export interface InjectionToken<T> {
  readonly key: symbol;
  readonly description: string;
  readonly multi: boolean;
  /** Root-level default implementation. Without one, an unprovided token throws. */
  readonly factory?: (() => T) | undefined;
  /** Replaces the generic "no provider" advice for tokens with a known owner. */
  readonly hint?: string | undefined;
  /** Type carrier for inference. Always `undefined` at runtime. */
  readonly __type?: T | undefined;
}

export interface TokenOptions<T> {
  /** Every provider contributes one element and injection yields the array. */
  multi?: boolean | undefined;
  factory?: (() => T) | undefined;
  hint?: string | undefined;
}

/**
 * Defines a token with no implementation of its own — an abstract service another
 * package has to provide, or a plain configuration value.
 * @param description Name used in error messages; by convention the exported name
 * @param options `multi` for collected tokens, `factory` for a root default, `hint` for
 * the "no provider" message
 */
export function defineToken<T>(
  description: string,
  options: TokenOptions<T> = {},
): InjectionToken<T> {
  return {
    key: Symbol(description),
    description,
    multi: options.multi ?? false,
    factory: options.factory,
    hint: options.hint,
  };
}

/**
 * Defines a service: a token whose default implementation is built on first injection
 * and cached on the root injector, the equivalent of Angular's `providedIn: 'root'`.
 * The factory may `inject()` other services.
 * @param description Name used in error messages; by convention the exported name
 * @param factory Builds the service; runs at most once per root injector
 * @see https://angular.dev/api/core/Injectable
 */
export function defineService<T>(description: string, factory: () => T): InjectionToken<T> {
  return defineToken<T>(description, { factory });
}

/** The value type behind a token, for the `type Xxx = ServiceOf<typeof Xxx>` alias. */
export type ServiceOf<Tk> = Tk extends InjectionToken<infer T> ? T : never;
