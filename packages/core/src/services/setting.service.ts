import { computed, type ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import { ConfigStateService } from './config-state.service';

/**
 * Settings, separated from `ConfigStateService` so a bundle that only reads settings does
 * not carry the rest of it. Angular has these as methods on the configuration service.
 */
export const SettingService = defineService('SettingService', () => {
  const configState = inject(ConfigStateService);

  return {
    get: (name: string): ComputedRef<string | undefined> => configState.getSetting(name),

    getBoolean: (name: string): ComputedRef<boolean> => {
      const value = configState.getSetting(name);
      return computed(() => value.value?.toLowerCase() === 'true');
    },

    getAll: (keyword?: string): ComputedRef<Record<string, string>> =>
      configState.getSettings(keyword),
  };
});
export type SettingService = ServiceOf<typeof SettingService>;

export const useSetting = (): SettingService => inject(SettingService);
