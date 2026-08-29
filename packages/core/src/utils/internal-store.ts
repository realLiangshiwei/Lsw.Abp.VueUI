import { deepMerge, type DeepPartial } from '@lsw-abpvue/utils';
import { computed, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue';

/**
 * The state container every ABP service is built on. Shallow on purpose: the application
 * configuration is a large object that is replaced wholesale, so making it deeply
 * reactive would cost a full walk on every refresh and buy nothing.
 *
 * `state` is the current value and `onUpdate` reports changes, which is the split
 * Angular makes between `sliceState` and `sliceUpdate`.
 */
export class InternalStore<S extends object> {
  readonly #state: ShallowRef<S>;
  readonly #initial: S;

  constructor(initialState: S) {
    this.#state = shallowRef(initialState) as ShallowRef<S>;
    this.#initial = initialState;
  }

  get state(): Readonly<ShallowRef<S>> {
    return this.#state;
  }

  /**
   * A reactive view of part of the state.
   * @param selector Picks the part to watch
   * @param equals Decides whether a new selection counts as a change; the default is
   * reference equality, which is what a slice of a replaced object needs
   */
  slice<T>(selector: (state: S) => T, equals: (a: T, b: T) => boolean = Object.is): ComputedRef<T> {
    let previous: T;
    let hasPrevious = false;

    return computed(() => {
      const next = selector(this.#state.value);
      // Memoising in here is what lets `equals` widen the default identity check: handing
      // back the previous reference is how a computed tells Vue nothing changed.
      if (hasPrevious && equals(previous, next)) return previous;

      previous = next;
      hasPrevious = true;
      return next;
    });
  }

  /**
   * Calls back when the selected part of the state changes. Synchronous, matching the
   * moment Angular's `sliceUpdate` emits, so a guard reading the state right after a
   * write sees the same thing the callback did.
   * @param selector Picks the part to watch
   * @param callback Receives the new value
   * @returns Stops the subscription
   */
  onUpdate<T>(selector: (state: S) => T, callback: (value: T) => void): () => void {
    // Wrapped rather than passed straight to watch: the callback is documented as
    // taking one argument, and Vue would hand it the old value and a cleanup hook too.
    return watch(
      () => selector(this.#state.value),
      value => callback(value),
      { flush: 'sync' },
    );
  }

  set(state: S): void {
    this.#state.value = state;
  }

  patch(partial: Partial<S>): void {
    this.#state.value = { ...this.#state.value, ...partial };
  }

  deepPatch(partial: DeepPartial<S>): void {
    this.#state.value = deepMerge<S>(this.#state.value, partial);
  }

  reset(): void {
    this.#state.value = this.#initial;
  }
}
