import { onScopeDispose } from 'vue';

export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void;
  /** Drops a pending call. Runs automatically when the owning scope is disposed. */
  cancel(): void;
}

/**
 * Delays a call until it stops being made for `ms`. Cancelled with the component that
 * created it, so a filter box cannot fire after its page is gone.
 * @param fn Function to delay
 * @param ms Quiet period in milliseconds
 */
export function useDebounceFn<A extends unknown[]>(
  fn: (...args: A) => unknown,
  ms: number,
): DebouncedFn<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const debounced = (...args: A) => {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  };

  onScopeDispose(cancel, true);

  return Object.assign(debounced, { cancel });
}
