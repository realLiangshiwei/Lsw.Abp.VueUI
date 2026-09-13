import { isDevMode } from '@lsw-abpvue/utils';
import { computed, shallowRef, type ComputedRef } from 'vue';
import { inject } from '../di/inject.js';
import { onServiceDestroy } from '../di/injector.js';
import { defineService, type ServiceOf } from '../di/token.js';
import type { AbpLocalization, LocalizationParam } from '../models/localization.js';
import type { LanguageInfo } from '../proxy/models.js';
import { LOCALIZATIONS, REGISTER_LOCALE } from '../tokens/localization.token.js';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token.js';
import {
  createLocalizer,
  flattenResources,
  mergeTexts,
  type ResourceTexts,
} from '../utils/localizer.js';
import { ConfigStateService } from './config-state.service.js';
import { HttpClient } from './http-client.service.js';
import { SessionStateService } from './session-state.service.js';

const DEFAULT_UI_LOCALIZATION_PATH = '/assets/localization';

function toResourceTexts(
  localizations: readonly AbpLocalization[],
  culture: string,
): ResourceTexts {
  const texts: ResourceTexts = {};

  for (const localization of localizations.filter(entry => entry.culture === culture)) {
    for (const resource of localization.resources) {
      texts[resource.resourceName] = { ...texts[resource.resourceName], ...resource.texts };
    }
  }

  return texts;
}

export const LocalizationService = defineService('LocalizationService', () => {
  const configState = inject(ConfigStateService);
  const session = inject(SessionStateService);
  const options = inject(ABP_ROOT_OPTIONS);
  const registerLocaleFn = inject(REGISTER_LOCALE);
  const http = inject(HttpClient);
  const provided = inject(LOCALIZATIONS, { optional: true });

  const shipped = shallowRef<AbpLocalization[]>([...(provided ?? [])]);
  const listeners = new Set<(culture: string) => void>();
  const localization = configState.getOne('localization');

  const currentLang = computed(
    () => session.getLanguage() ?? localization.value.currentCulture.cultureName ?? '',
  );

  /** Texts shipped with the application win over the ones the backend sent. */
  const texts = computed(() =>
    mergeTexts(
      flattenResources(localization.value),
      toResourceTexts(shipped.value, currentLang.value),
    ),
  );

  const translate = (param: LocalizationParam, params: unknown[]): string =>
    createLocalizer({
      texts: texts.value,
      // The backend sends null when there is no default resource, which is the same
      // thing as not having one.
      defaultResourceName: localization.value.defaultResourceName ?? undefined,
      onMissing: message => {
        if (isDevMode()) console.warn(`[abp] ${message}`);
      },
    })(param, params);

  /** ABP 9's file-based texts: `{basePath}/{culture}.json`, missing files ignored. */
  async function loadUiTexts(culture: string): Promise<void> {
    const uiLocalization = options.uiLocalization;
    if (!uiLocalization?.enabled) return;

    const basePath = uiLocalization.basePath ?? DEFAULT_UI_LOCALIZATION_PATH;

    try {
      const response = await http.request<Record<string, Record<string, string>>>({
        method: 'GET',
        url: `${basePath}/${culture}.json`,
      });

      addLocalization([
        {
          culture,
          resources: Object.entries(response.body).map(([resourceName, texts]) => ({
            resourceName,
            texts,
          })),
        },
      ]);
    } catch {
      // A culture without a file is normal: the backend's texts are the whole answer.
    }
  }

  function addLocalization(localizations: AbpLocalization[]): void {
    shipped.value = [...shipped.value, ...localizations];
  }

  async function applyLanguage(culture: string): Promise<void> {
    if (localization.value.currentCulture.cultureName === culture) return;

    await configState.refreshLocalization(culture);
    await loadUiTexts(culture);
    await registerLocaleFn(culture);

    for (const listener of [...listeners]) listener(culture);
  }

  // Changing the language in another tab has to load its texts here too.
  let pending: Promise<void> = Promise.resolve();
  onServiceDestroy(
    session.onLanguageChange(culture => {
      if (culture) pending = applyLanguage(culture);
    }),
  );

  return {
    /** The text right now. In a template prefer `$t`, which re-renders on its own. */
    t: (key: LocalizationParam, ...params: unknown[]): string => translate(key, params),

    /** The text as a reactive value, for use outside templates. */
    tr: (key: LocalizationParam, ...params: unknown[]): ComputedRef<string> =>
      computed(() => translate(key, params)),

    currentLang: currentLang as ComputedRef<string>,
    languages: computed(() => localization.value.languages) as ComputedRef<LanguageInfo[]>,

    /**
     * Switches language: stores the choice, fetches that culture's texts and tells the
     * application to switch anything else that is language-dependent.
     * @param cultureName Culture to switch to, e.g. `tr`
     */
    setLanguage: async (cultureName: string): Promise<void> => {
      session.setLanguage(cultureName);
      await pending;
    },

    /**
     * @param callback Runs once the new language's texts are in place
     * @returns Stops listening
     */
    onLanguageChange: (callback: (culture: string) => void): (() => void) => {
      listeners.add(callback);
      return () => void listeners.delete(callback);
    },

    /**
     * The first of the candidate keys that has a text, in the `Resource::Key` form
     * something else can localize later. ABP's object extensions name their display
     * texts by convention rather than by key, and this is how the convention is
     * resolved once, at assembly time, into a key that survives a language change.
     *
     * @param resourceNames Resources to look in, in order; the default resource is
     * looked in last
     * @param keys Candidate keys, in order
     * @param fallback Returned when none of them has a text
     * @see `createLocalizationPipeKeyGenerator` in `@abp/ng.core`
     */
    findKey: (
      resourceNames: readonly string[],
      keys: readonly string[],
      fallback?: string,
    ): string | undefined => {
      const resources = [...resourceNames, localization.value.defaultResourceName ?? ''].filter(
        Boolean,
      );

      for (const resourceName of resources) {
        for (const key of keys) {
          // `_` means the key is already the text, the way the localizer reads it.
          if (resourceName === '_') return key;
          if (key && texts.value[resourceName]?.[key]) return `${resourceName}::${key}`;
        }
      }

      return fallback;
    },

    /** Adds texts at runtime; they win over the backend's for the same key. */
    addLocalization,

    registerLocale: (cultureName: string): Promise<void> => registerLocaleFn(cultureName),
  };
});
export type LocalizationService = ServiceOf<typeof LocalizationService>;

export const useLocalization = (): LocalizationService => inject(LocalizationService);

declare module 'vue' {
  interface ComponentCustomProperties {
    /** Localized text, reactive: a language change re-renders whatever used it. */
    $t: (key: LocalizationParam, ...params: unknown[]) => string;
  }
}
