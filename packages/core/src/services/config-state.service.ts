import { isPlainObject } from '@lsw-abpvue/utils';
import type { ComputedRef } from 'vue';
import type { RestConfig } from '../models/http.js';
import { inject } from '../di/inject.js';
import { defineService, type ServiceOf } from '../di/token.js';
import { AbpApplicationConfigurationService } from '../proxy/asp-net-core/mvc/application-configurations/abp-application-configuration.service.js';
import { AbpApplicationLocalizationService } from '../proxy/asp-net-core/mvc/application-configurations/abp-application-localization.service.js';
import type {
  ApplicationConfigurationDto,
  ApplicationLocalizationConfigurationDto,
} from '../proxy/models.js';
import { InternalStore } from '../utils/internal-store.js';
import { useLatest } from '../utils/use-latest.js';
import { SessionStateService } from './session-state.service.js';

function configurationState(configuration: ApplicationConfigurationDto = {}) {
  const localization = configuration.localization;
  const currentCulture = localization?.currentCulture;
  const user = configuration.currentUser;
  const zone = configuration.timing?.timeZone;
  return {
    ...configuration,
    localization: {
      ...localization,
      values: localization?.values ?? {},
      resources: localization?.resources ?? {},
      languages: localization?.languages ?? [],
      currentCulture: {
        ...currentCulture,
        isRightToLeft: currentCulture?.isRightToLeft ?? false,
        dateTimeFormat: currentCulture?.dateTimeFormat ?? {},
      },
      languagesMap: localization?.languagesMap ?? {},
      languageFilesMap: localization?.languageFilesMap ?? {},
      useRouteBasedCulture: localization?.useRouteBasedCulture ?? false,
    },
    auth: { ...configuration.auth, grantedPolicies: configuration.auth?.grantedPolicies ?? {} },
    setting: { ...configuration.setting, values: configuration.setting?.values ?? {} },
    currentUser: {
      ...user,
      isAuthenticated: user?.isAuthenticated ?? false,
      emailVerified: user?.emailVerified ?? false,
      phoneNumberVerified: user?.phoneNumberVerified ?? false,
      roles: user?.roles ?? [],
    },
    features: { ...configuration.features, values: configuration.features?.values ?? {} },
    globalFeatures: {
      ...configuration.globalFeatures,
      enabledFeatures: configuration.globalFeatures?.enabledFeatures ?? [],
    },
    multiTenancy: {
      ...configuration.multiTenancy,
      isEnabled: configuration.multiTenancy?.isEnabled ?? false,
      userSharingStrategy: configuration.multiTenancy?.userSharingStrategy ?? 0,
    },
    currentTenant: {
      ...configuration.currentTenant,
      isAvailable: configuration.currentTenant?.isAvailable ?? false,
    },
    timing: {
      ...configuration.timing,
      timeZone: { ...zone, iana: zone?.iana ?? {}, windows: zone?.windows ?? {} },
    },
    clock: { ...configuration.clock },
    objectExtensions: {
      ...configuration.objectExtensions,
      modules: configuration.objectExtensions?.modules ?? {},
      enums: configuration.objectExtensions?.enums ?? {},
    },
    extraProperties: configuration.extraProperties ?? {},
  };
}

export type ApplicationConfiguration = ReturnType<typeof configurationState>;

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
  const session = inject(SessionStateService);
  const store = new InternalStore<ApplicationConfiguration>(configurationState());
  const latest = useLatest<ApplicationConfiguration>();

  /**
   * The texts of one culture, in the shape the store keeps them.
   *
   * Defensive about what comes back: a gateway answering 200 with something else must
   * not take startup down, and the texts are recoverable on the next language change.
   */
  async function textsOf(
    cultureName: string,
    config?: RestConfig,
  ): Promise<Partial<ApplicationLocalizationConfigurationDto>> {
    const localization = await appLocalization.get({ cultureName, onlyDynamics: false }, config);
    const resources = localization.resources ?? {};

    return {
      resources,
      values: Object.fromEntries(
        Object.entries(resources).map(([name, resource]) => [name, resource.texts ?? {}]),
      ),
      ...(localization.currentCulture ? { currentCulture: localization.currentCulture } : {}),
    };
  }

  async function readAppState(config?: RestConfig): Promise<ApplicationConfiguration> {
    const application = configurationState(
      await appConfiguration.get({ includeLocalizationResources: false }, config),
    );
    const culture =
      session.getLanguage()?.split(';')[0] ||
      application.localization?.currentCulture?.cultureName?.split(';')[0];
    if (!culture) return application;
    return configurationState({
      ...application,
      localization: { ...application.localization, ...(await textsOf(culture, config)) },
    });
  }

  return {
    getAll: (): ComputedRef<ApplicationConfiguration> => store.slice(state => state),

    getOne: <K extends keyof ApplicationConfiguration>(
      key: K,
    ): ComputedRef<ApplicationConfiguration[K]> => store.slice(state => state[key]),

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
    snapshot: (): ApplicationConfiguration => store.state.value,

    setState: (configuration: ApplicationConfigurationDto): void => {
      latest.cancel();
      store.set(configurationState(configuration));
    },

    clearIdentity: (): void => {
      latest.cancel();
      store.set({
        ...configurationState(),
        localization: store.state.value.localization,
        multiTenancy: store.state.value.multiTenancy,
        currentTenant: session.getTenant() ?? { isAvailable: false },
      });
    },

    /** Reads configuration and localization without changing the active identity. */
    readAppState,

    onUpdate: (callback: (configuration: ApplicationConfiguration) => void): (() => void) =>
      store.onUpdate(state => state, callback),

    /**
     * Reloads the configuration, texts included. Overlapping calls -- two tenant switches
     * in a row, a login while a refresh is in flight -- resolve to the newest one; the
     * abandoned request is aborted and its answer never reaches the store.
     *
     * The texts are fetched separately because the configuration is asked to leave them
     * out, and they are put back before the store is replaced: a refresh that dropped
     * them would blank every label in the UI, and a login triggers one.
     */
    refreshAppState: async (): Promise<ApplicationConfiguration> => {
      const configuration = await latest.run(signal => readAppState({ signal }));

      if (configuration) store.set(configuration);
      return store.state.value;
    },

    /**
     * Loads the texts of one culture without touching the rest of the configuration,
     * which is what a language change needs.
     * @param cultureName Culture to load, e.g. `tr` or `en-GB`
     */
    refreshLocalization: async (cultureName: string): Promise<void> => {
      store.deepPatch({ localization: await textsOf(cultureName) });
    },
  };
});
export type ConfigStateService = ServiceOf<typeof ConfigStateService>;

export const useConfigState = (): ConfigStateService => inject(ConfigStateService);
