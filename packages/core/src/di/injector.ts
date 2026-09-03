import {
  CircularDependencyError,
  InjectorDestroyedError,
  InvalidProviderError,
  MultiProviderMismatchError,
  NullInjectorError,
  OutsideInjectionContextError,
} from './errors.js';
import { getCurrentInjector, runInInjectionContext } from './inject.js';
import { flattenProviders, type Provider, type ProviderInput } from './provider.js';
import type { InjectionToken } from './token.js';

export interface InjectOptions {
  optional?: boolean | undefined;
}

/**
 * A node of the injector tree. Every application has a root injector; `provideAbp()`
 * adds one per component subtree.
 */
export interface Injector {
  readonly parent: Injector | null;
  get<T>(token: InjectionToken<T>): T;
  /**
   * @param notFoundValue Returned instead of throwing when nothing provides the token
   */
  get<T, D>(token: InjectionToken<T>, notFoundValue: D, options?: InjectOptions): T | D;
  /** Runs `fn` in this injector's injection context. */
  runInContext<R>(fn: () => R): R;
  /** Runs the `onServiceDestroy` hooks of everything this injector built, newest first. */
  destroy(): void;
}

type ProviderRecord =
  | { readonly multi: false; provider: Provider }
  | { readonly multi: true; readonly providers: Provider[] };

const NOT_FOUND = Symbol('abp.notFound');

/**
 * Tokens being resolved right now, outermost first — the resolution path of an error and
 * the cycle detector in one. Module level with the same reasoning as the injection
 * context stack: it never spans an `await` (design 02 §5).
 */
const resolving: InjectionToken<unknown>[] = [];

/** Destroy hooks per injector, so `onServiceDestroy` needs no access to internals. */
const destroyHooks = new WeakMap<Injector, (() => void)[]>();

function pathTo(token: InjectionToken<unknown>): string[] {
  return [...resolving, token].map(entry => entry.description);
}

class AbpInjector implements Injector {
  readonly parent: Injector | null;
  readonly #records = new Map<symbol, ProviderRecord>();
  readonly #instances = new Map<symbol, unknown>();
  #destroyed = false;

  constructor(providers: readonly ProviderInput[], parent: Injector | null) {
    this.parent = parent;
    for (const provider of flattenProviders(providers)) this.#record(provider);
  }

  get<T>(token: InjectionToken<T>): T;
  get<T, D>(token: InjectionToken<T>, notFoundValue: D, options?: InjectOptions): T | D;
  get(
    token: InjectionToken<unknown>,
    // `options` is accepted for symmetry with inject(); passing a notFoundValue at all is
    // what makes a lookup optional, so nothing here reads it.
    ...rest: [notFoundValue?: unknown, options?: InjectOptions]
  ): unknown {
    if (this.#destroyed) throw new InjectorDestroyedError(token.description);

    const value = this.#resolve(token);
    if (value !== NOT_FOUND) return value;
    if (rest.length > 0) return rest[0];

    throw new NullInjectorError(token, pathTo(token));
  }

  runInContext<R>(fn: () => R): R {
    return runInInjectionContext(this, fn);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    const hooks = destroyHooks.get(this) ?? [];
    destroyHooks.delete(this);
    for (const hook of [...hooks].reverse()) hook();

    this.#instances.clear();
    this.#records.clear();
  }

  #record(provider: Provider): void {
    const token = provider.provide;
    const multi = provider.multi === true;
    if (multi !== token.multi) throw new MultiProviderMismatchError(token);

    if (!multi) {
      // Last one wins, so a later provider in the same list overrides an earlier default.
      this.#records.set(token.key, { multi: false, provider });
      return;
    }

    const existing = this.#records.get(token.key);
    if (existing?.multi) existing.providers.push(provider);
    else this.#records.set(token.key, { multi: true, providers: [provider] });
  }

  #resolve(token: InjectionToken<unknown>): unknown {
    if (this.#instances.has(token.key)) return this.#instances.get(token.key);

    const record = this.#records.get(token.key);
    if (record) {
      const value = record.multi
        ? this.#collect(token, record.providers)
        : this.#instantiate(token, () => this.#evaluate(token, record.provider));
      this.#instances.set(token.key, value);
      return value;
    }

    if (this.parent) return this.parent.get(token, NOT_FOUND);

    // The chain ended here, so this is the root: a token that carries its own default
    // gets built once, here, no matter which injector asked for it.
    const factory = token.factory;
    if (factory) {
      const value = this.#instantiate(token, () => this.runInContext(factory));
      this.#instances.set(token.key, value);
      return value;
    }

    return NOT_FOUND;
  }

  /** Multi tokens add to what the parent chain contributes instead of replacing it. */
  #collect(token: InjectionToken<unknown>, providers: readonly Provider[]): unknown[] {
    const inherited = this.parent ? this.parent.get(token, NOT_FOUND) : NOT_FOUND;
    const base = inherited === NOT_FOUND ? [] : (inherited as unknown[]);

    return [
      ...base,
      ...providers.map(provider => this.#instantiate(token, () => this.#evaluate(token, provider))),
    ];
  }

  #instantiate(token: InjectionToken<unknown>, run: () => unknown): unknown {
    if (resolving.some(entry => entry.key === token.key)) {
      throw new CircularDependencyError(pathTo(token));
    }

    resolving.push(token);
    try {
      return run();
    } finally {
      resolving.pop();
    }
  }

  #evaluate(token: InjectionToken<unknown>, provider: Provider): unknown {
    if ('useValue' in provider) return provider.useValue;
    if ('useFactory' in provider) return this.runInContext(provider.useFactory);
    if ('useClass' in provider) {
      const Implementation = provider.useClass;
      return this.runInContext(() => new Implementation());
    }
    if ('useExisting' in provider) return this.get(provider.useExisting);

    throw new InvalidProviderError(token.description);
  }
}

/**
 * Creates an injector node.
 * @param providers Providers of this node, later ones overriding earlier ones
 * @param parent Injector to fall back to; `null` makes this a root
 */
export function createInjector(
  providers: readonly ProviderInput[],
  parent: Injector | null = null,
): Injector {
  return new AbpInjector(providers, parent);
}

/**
 * Registers cleanup for the service being built, run when its injector is destroyed.
 * Hooks run newest first, so a service can rely on the ones it depends on still working.
 * @param fn Cleanup to run on destroy
 */
export function onServiceDestroy(fn: () => void): void {
  const injector = getCurrentInjector();
  if (!injector) throw new OutsideInjectionContextError('onServiceDestroy()');

  const hooks = destroyHooks.get(injector);
  if (hooks) hooks.push(fn);
  else destroyHooks.set(injector, [fn]);
}
