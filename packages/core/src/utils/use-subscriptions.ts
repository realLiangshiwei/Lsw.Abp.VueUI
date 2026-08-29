import { onScopeDispose } from 'vue';

export interface Subscriptions {
  /** Keeps an unsubscribe function to run later. */
  add(...unsubscribes: (() => void)[]): void;
  /** Runs every kept unsubscribe and forgets them. */
  clear(): void;
}

/**
 * Collects unsubscribe functions and runs them when the owning scope is disposed, so a
 * service or component does not have to keep a field per subscription.
 */
export function useSubscriptions(): Subscriptions {
  const unsubscribes: (() => void)[] = [];

  const clear = () => {
    for (const unsubscribe of unsubscribes.splice(0)) unsubscribe();
  };

  onScopeDispose(clear, true);

  return {
    add: (...added) => void unsubscribes.push(...added),
    clear,
  };
}
