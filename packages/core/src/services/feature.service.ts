import type { ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import { ConfigStateService } from './config-state.service';

export const FeatureService = defineService('FeatureService', () => {
  const configState = inject(ConfigStateService);

  return {
    get: (name: string): ComputedRef<string | undefined> => configState.getFeature(name),
    isEnabled: (name: string): ComputedRef<boolean> => configState.getFeatureIsEnabled(name),
    /** Global features are switched off at the solution level, before any tenant. */
    isGlobalEnabled: (name: string): ComputedRef<boolean> =>
      configState.getGlobalFeatureIsEnabled(name),
  };
});
export type FeatureService = ServiceOf<typeof FeatureService>;

export const useFeature = (): FeatureService => inject(FeatureService);
