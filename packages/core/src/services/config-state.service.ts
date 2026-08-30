import { isPlainObject } from '@lsw-abpvue/utils';
import type { ComputedRef } from 'vue';
import { inject } from '../di/inject';
import { defineService, type ServiceOf } from '../di/token';
import { AbpApplicationConfigurationService } from '../proxy/abp-application-configuration.service';
import { AbpApplicationLocalizationService } from '../proxy/abp-application-localization.service';
import type { ApplicationConfigurationDto } from '../proxy/models';
import { InternalStore } from '../utils/internal-store';
import { useLatest } from '../utils/use-latest';

/**
 * A complete but empty configuration, so everything reading it works before the first
 * response arrives. Angular starts from `{}` and makes every caller guard; this is the
 * same information with the guards paid for once.
 */
function emptyConfiguration(): ApplicationConfigurationDto {
  return {
    localization: {
      values: {},
      resources: {},
      languages: [],
      currentCulture: { isRightToLeft: false, dateTimeFormat: {} },
      languagesMap: {},
      languageFilesMap: {},
      useRouteBasedCulture: false,
    },
    auth: { grantedPolicies: {} },
    setting: { values: {} },
    currentUser: {
      isAuthenticated: false,
      emailVerified: false,
      phoneNumberVerified: false,
      roles: [],
    },
    features: { values: {} },
    globalFeatures: { enabledFeatures: [] },
    multiTenancy: { isEnabled: false },
    currentTenant: { isAvailable: false },
    timing: { timeZone: { iana: {}, windows: {} } },
    clock: {},
    objectExtensions: { modules: {}, enums: {} },
    extraProperties: {},
  };
}

function resolvePath(source: unknown, path: string | string[]): unknown {
  const segments = Array.isArray(path) ? path : path.split('.');

  return segments.reduce<unknown>(
    (value, key) => (isPlainObject(value) ? value[key] : undefined),
    source,
  );
}

function sameEntries(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key]);
}

/**
 * Everything `/api/abp/application-configuration` returns: the current user, the granted
 * policies, settings, features, the tenant and the localization tables. Refreshed after
 * every login, logout and tenant switch, which is what makes menus and permission checks
 * recompute on their own.
 */
export const ConfigStateService = defineService('ConfigStateService', () => {
  const appConfiguration = inject(AbpApplicationConfigurationService);
  const appLocalization = inject(AbpApplicationLocalizationService);
  const store = new InternalStore<ApplicationConfigurationDto>(emptyConfiguration());
  const latest = useLatest<ApplicationConfigurationDto>();

  return {
    getAll: (): ComputedRef<ApplicationConfigurationDto> => store.slice(state => state),

    getOne: <K extends keyof ApplicationConfigurationDto>(
      key: K,
    ): ComputedRef<ApplicationConfigurationDto[K]> => store.slice(state => state[key]),

    /** @param path Dotted path, e.g. `localization.currentCulture.cultureName` */
    getDeep: <T = unknown>(path: string | string[]): ComputedRef<T> =>
      store.slice(state => resolvePath(state, path) as T),

    getSetting: (key: string): ComputedRef<string | undefined> =>
      store.slice(state => state.setting.values[key]),

    getSettings: (keyword?: string): ComputedRef<Record<string, string>> =>
      store.slice(
        state =>
          Object.fromEntries(
            Object.entries(state.setting.values).filter(
              ([key]) => !keyword || key.includes(keyword),
            ),
          ),
        sameEntries,
      ),

    getFeature: (key: string): ComputedRef<string | undefined> =>
      store.slice(state => state.features.values[key]),

    getFeatureIsEnabled: (key: string): ComputedRef<boolean> =>
      store.slice(state => state.features.values[key]?.toLowerCase() === 'true'),

    getGlobalFeatureIsEnabled: (key: string): ComputedRef<boolean> =>
      store.slice(state => state.globalFeatures.enabledFeatures.includes(key)),

    /** The current value, for guards and other places that cannot be reactive. */
    snapshot: (): ApplicationConfigurationDto => store.state.value,

    setState: (configuration: ApplicationConfigurationDto): void => store.set(configuration),

    onUpdate: (callback: (configuration: ApplicationConfigurationDto) => void): (() => void) =>
      store.onUpdate(state => state, callback),

    /**
     * Reloads the configuration. Overlapping calls -- two tenant switches in a row, a
     * login while a refresh is in flight -- resolve to the newest one; the abandoned
     * request is aborted and its answer never reaches the store.
     */
    refreshAppState: async (): Promise<ApplicationConfigurationDto> => {
      const configuration = await latest.run(signal =>
        appConfiguration.get({ includeLocalizationResources: false }, { signal }),
      );

      if (configuration) store.set(configuration);
      return store.state.value;
    },

    /**
     * Loads the localization texts of one culture, which the configuration endpoint is
     * asked to leave out because they are by far the largest part of it.
     * @param cultureName Culture to load, e.g. `tr` or `en-GB`
     */
    refreshLocalization: async (cultureName: string): Promise<void> => {
      const localization = await appLocalization.get({ cultureName, onlyDynamics: false });
      // Defensive about the shape: a gateway answering 200 with something else must not
      // take startup down, and the texts are recoverable on the next language change.
      const resources = localization.resources ?? {};
      const values = Object.fromEntries(
        Object.entries(resources).map(([name, resource]) => [name, resource.texts]),
      );

      store.deepPatch({
        localization: {
          resources,
          values,
          ...(localization.currentCulture ? { currentCulture: localization.currentCulture } : {}),
        },
      });
    },
  };
});
export type ConfigStateService = ServiceOf<typeof ConfigStateService>;

export const useConfigState = (): ConfigStateService => inject(ConfigStateService);
