import {
  getCurrentInstance,
  inject as vueInject,
  type ComponentInternalInstance,
  type InjectionKey,
} from 'vue';
import { OutsideInjectionContextError } from './errors';
import type { Injector } from './injector';
import type { InjectionToken } from './token';

/** Where the Vue component tree carries the injector that covers it. */
export const ABP_INJECTOR_KEY: InjectionKey<Injector> = Symbol('abp.injector');

/**
 * Open injection contexts, innermost last. Module level, yet safe under SSR: it is only
 * ever non-empty during synchronous execution and never spans an `await`, so two
 * concurrent requests cannot see each other's entries (design 02 §5).
 */
const contexts: Injector[] = [];

/**
 * Injectors added by `provideAbp()`, keyed by the component that added them. Vue's own
 * `inject()` deliberately cannot see what the same component just provided, but a page
 * that overrides a service does expect to use its own override — the way a component
 * with `providers: []` does in Angular.
 */
const componentInjectors = new WeakMap<ComponentInternalInstance, Injector>();

/** Called by `provideAbp`; not part of the public API. */
export function setComponentInjector(
  instance: ComponentInternalInstance,
  injector: Injector,
): void {
  componentInjectors.set(instance, injector);
}

/**
 * Runs `fn` with `injector` as the current injection context, so anything it calls can
 * use `inject()`.
 * @param injector Injector that `inject()` resolves against
 * @param fn Function to run synchronously
 */
export function runInInjectionContext<R>(injector: Injector, fn: () => R): R {
  contexts.push(injector);
  try {
    return fn();
  } finally {
    contexts.pop();
  }
}

/**
 * The injector `inject()` would use right now: the innermost explicit context, else the
 * one covering the component being set up. Capture it before an `await` when a service
 * is needed afterwards.
 */
export function getCurrentInjector(): Injector | null {
  const explicit = contexts.at(-1);
  if (explicit) return explicit;

  // Vue's inject() warns when there is no component being set up, so ask first.
  const instance = getCurrentInstance();
  if (!instance) return null;

  return componentInjectors.get(instance) ?? vueInject(ABP_INJECTOR_KEY, null) ?? null;
}

/**
 * Resolves a token against the current injection context.
 *
 * Only valid synchronously inside a service factory, a component's `<script setup>` or
 * `runInInjectionContext`. After an `await` the context is gone.
 * @param token Token to resolve
 * @param options `{ optional: true }` returns `null` instead of throwing
 */
export function inject<T>(token: InjectionToken<T>): T;
export function inject<T>(token: InjectionToken<T>, options: { optional: true }): T | null;
export function inject<T>(
  token: InjectionToken<T>,
  options?: { optional?: boolean | undefined },
): T | null {
  const injector = getCurrentInjector();
  if (!injector) throw new OutsideInjectionContextError(`inject(${token.description})`);

  return options?.optional === true
    ? injector.get(token, null, { optional: true })
    : injector.get(token);
}
