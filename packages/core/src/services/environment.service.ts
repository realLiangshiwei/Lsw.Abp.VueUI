import type { ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import type { Environment } from '../models/environment';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { InternalStore } from '../utils/internal-store';

export const EnvironmentService = defineService('EnvironmentService', () => {
  const store = new InternalStore<Environment>(inject(ABP_ROOT_OPTIONS).environment);

  return {
    getEnvironment: (): Environment => store.state.value,
    getEnvironment$: (): ComputedRef<Environment> => store.slice(environment => environment),

    /**
     * Base URL of one backend. Microservice solutions name several under `apis`; a name
     * nobody configured falls back to `apis.default`.
     * @param apiName Key in `apis`, defaulting to `default`
     */
    getApiUrl: (apiName?: string): string => {
      const apis = store.state.value.apis;
      return apis[apiName ?? 'default']?.url ?? apis.default.url;
    },

    /** Replaces the environment, for a host that resolves it at runtime. */
    setState: (environment: Environment): void => store.set(environment),
  };
});
export type EnvironmentService = ServiceOf<typeof EnvironmentService>;

export const useEnvironment = (): EnvironmentService => inject(EnvironmentService);
