import { computed, shallowRef, type ComputedRef } from 'vue';
import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';

/** Counts requests in flight so a theme can show one loading bar for all of them. */
export const HttpWaitService = defineService('HttpWaitService', () => {
  const inFlight = shallowRef(0);

  return {
    loading: computed(() => inFlight.value > 0) as ComputedRef<boolean>,

    /**
     * Counts one request as started.
     * @returns Counts it as finished; safe to call more than once
     */
    start: (): (() => void) => {
      inFlight.value += 1;
      let finished = false;

      return () => {
        if (finished) return;
        finished = true;
        inFlight.value -= 1;
      };
    },

    /** Forgets every request in flight, for a navigation that abandons them. */
    clear: (): void => {
      inFlight.value = 0;
    },
  };
});
export type HttpWaitService = ServiceOf<typeof HttpWaitService>;

export const useHttpWait = (): HttpWaitService => inject(HttpWaitService);
