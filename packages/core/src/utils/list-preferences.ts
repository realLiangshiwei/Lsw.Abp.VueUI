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

function validPreferences(value: unknown): ListPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const stored = value as Record<string, unknown>;
  return {
    ...(typeof stored.maxResultCount === 'number' &&
    Number.isInteger(stored.maxResultCount) &&
    stored.maxResultCount > 0
      ? { maxResultCount: stored.maxResultCount }
      : {}),
    ...(typeof stored.sortKey === 'string' ? { sortKey: stored.sortKey } : {}),
    ...(stored.sortOrder === '' || stored.sortOrder === 'asc' || stored.sortOrder === 'desc'
      ? { sortOrder: stored.sortOrder }
      : {}),
    ...(Array.isArray(stored.hiddenColumns)
      ? {
          hiddenColumns: [
            ...new Set(
              stored.hiddenColumns.filter((key): key is string => typeof key === 'string'),
            ),
          ],
        }
      : {}),
  };
}

/** Clears this user's list preferences when their session ends. */
export function clearListPreferences(storage: StorageService, userId?: string | null): void {
  if (!userId) return;
  try {
    for (const key of storage.keys()) {
      if (key.startsWith('abpvue.list.') && key.endsWith(`.${userId}`)) storage.removeItem(key);
    }
  } catch {
    // Blocked storage must not prevent a session from ending.
  }
}

/**
 * The stored preferences of one list. Call it in an injection context.
 * @param persistKey Names the list; by convention the component key, e.g. `Identity.UsersComponent`
 */
export function useListPreferences(persistKey: string): ListPreferenceStore {
  const storage = inject(StorageService);
  const configState = inject(ConfigStateService);

  const keyOf = (): string =>
    `abpvue.list.${persistKey}.${configState.snapshot().currentUser.id ?? 'anonymous'}`;

  const read = (): ListPreferences => {
    try {
      const stored = storage.getItem(keyOf());
      return stored ? validPreferences(JSON.parse(stored)) : {};
    } catch {
      return {};
    }
  };

  return {
    read,

    patch: preferences => {
      try {
        storage.setItem(keyOf(), JSON.stringify(validPreferences({ ...read(), ...preferences })));
      } catch (error) {
        if (isDevMode()) {
          console.warn(`[abp] Could not store the preferences of "${persistKey}".`, error);
        }
      }
    },
  };
}
