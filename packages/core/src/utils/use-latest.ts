/**
 * Keeps only the newest of a series of overlapping requests, the way `switchMap` does:
 * starting a new run aborts the one before it, and the abandoned call resolves to
 * `undefined` instead of overwriting fresher state or reporting a failure. Being
 * superseded is not an error, so the abandoned call's rejection is swallowed too.
 */
export function useLatest<T>(): {
  run(fn: (signal: AbortSignal) => Promise<T>): Promise<T | undefined>;
} {
  let pending: AbortController | null = null;

  return {
    async run(fn) {
      pending?.abort();

      const own = new AbortController();
      pending = own;

      try {
        const result = await fn(own.signal);
        return own.signal.aborted ? undefined : result;
      } catch (error) {
        if (own.signal.aborted) return undefined;
        throw error;
      }
    },
  };
}
