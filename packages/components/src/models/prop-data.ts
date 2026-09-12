import type { Injector } from '@lsw-abpvue/core';
import { isDevMode } from '@lsw-abpvue/utils';
import { computed, isRef, shallowRef, type Ref } from 'vue';

/**
 * Reaches any service from a callback. Contributor callbacks are plain functions rather
 * than components, so they are outside every injection context; this is the way out,
 * and it is why the extension system needs a real injector (research 02, E2).
 */
export type GetInjected = Injector['get'];

/** What a prop callback is told about the row it is rendering for. */
export interface PropData<R = unknown> {
  readonly record: R;
  readonly index?: number | undefined;
  readonly getInjected: GetInjected;
}

/** What a toolbar callback is told about: the whole page of records, and no index. */
export type ToolbarData<R = unknown> = PropData<readonly R[]>;

/**
 * A value a callback may hand back: the value itself, a promise, a ref or a getter.
 * There is no `Observable` here and no RxJS anywhere (difference 3); the framework
 * unwraps all four shapes the same way.
 */
export type Resolvable<T> = T | Promise<T> | Ref<T> | (() => T);

/** Where a tooltip sits next to the thing it explains. */
export interface PropTooltip {
  /** Localization key. */
  text: string;
  params?: readonly string[] | undefined;
  placement?: 'top' | 'end' | 'bottom' | 'start' | undefined;
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return typeof (value as Promise<T> | undefined)?.then === 'function';
}

/**
 * Turns any of the four shapes of {@link Resolvable} into one ref. A promise resolves
 * into it later, so a caller renders `undefined` until then rather than waiting.
 * @param value What a callback returned
 */
export function unwrapResolvable<T>(value: Resolvable<T>): Ref<T | undefined> {
  if (isRef(value)) return value as Ref<T | undefined>;

  if (typeof value === 'function') {
    return computed(() => (value as () => T)()) as Ref<T | undefined>;
  }

  if (isPromise<T>(value)) {
    const resolved = shallowRef<T>();
    value.then(
      next => {
        resolved.value = next;
      },
      // A rejected lookup leaves the value undefined rather than an unhandled rejection.
      // The request itself was already reported by the transport layer.
      (error: unknown) => {
        if (isDevMode()) console.warn('[abp] A prop callback was rejected.', error);
      },
    );

    return resolved;
  }

  // Shallow on purpose: the values are option lists and cell values, and nothing reads
  // them deeply enough to pay for deep reactivity.
  return shallowRef(value) as Ref<T | undefined>;
}
