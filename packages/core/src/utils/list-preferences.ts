import { inject } from '../di/inject.js';
import type { SortOrder } from '../models/list.js';
import { ConfigStateService } from '../services/config-state.service.js';
import { StorageService } from '../services/platform/storage.service.js';
import { isDevMode } from '@lsw-abpvue/utils';

/**
 * What a list remembers between visits. Deliberately not the filter or the page: those
 * are a query the user is running right now, not a preference (design 04 §14.1).
 */
export interface ListPreferences {
  maxResultCount?: number;
  sortKey?: string;
  sortOrder?: SortOrder;
  /** Columns the user hid; anything not named here is visible, new columns included. */
  hiddenColumns?: string[];
}

/** One entry per list per user, so two accounts on one machine never see each other's. */
export interface ListPreferenceStore {
  read(): ListPreferences;
  /** @param preferences Merged into what is stored */
  patch(preferences: ListPreferences): void;
}

/**
 * The stored preferences of one list. Call it in an injection context.
 * @param persistKey Names the list; by convention the component key, e.g. `Identity.Users`
 */
export function useListPreferences(persistKey: string): ListPreferenceStore {
  const storage = inject(StorageService);
  const configState = inject(ConfigStateService);

  const keyOf = (): string =>
    `abpvue.list.${persistKey}.${configState.snapshot().currentUser.id ?? 'anonymous'}`;

  const read = (): ListPreferences => {
    try {
      const stored = storage.getItem(keyOf());
      return stored ? (JSON.parse(stored) as ListPreferences) : {};
    } catch (error) {
      // A preference nobody can read is not worth failing a page over.
      if (isDevMode())
        console.warn(`[abp] Could not read the preferences of "${persistKey}".`, error);
      return {};
    }
  };

  return {
    read,

    patch: preferences => {
      try {
        storage.setItem(keyOf(), JSON.stringify({ ...read(), ...preferences }));
      } catch (error) {
        if (isDevMode()) {
          console.warn(`[abp] Could not store the preferences of "${persistKey}".`, error);
        }
      }
    },
  };
}
