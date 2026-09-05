import {
  DocumentService,
  defineService,
  inject,
  onServiceDestroy,
  StorageService,
  WindowService,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';

const STORAGE_KEY = 'abpThemeBasicMode';

/** What the user asked for; `system` follows the operating system. */
export type ThemeMode = 'light' | 'dark' | 'system';

const MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

function isMode(value: string | null): value is ThemeMode {
  return value !== null && MODES.includes(value as ThemeMode);
}

/**
 * Light and dark, on Bootstrap's own `data-bs-theme` so every Bootstrap component
 * follows without a stylesheet of ours in between.
 */
export const ThemeModeService = defineService('ThemeModeService', () => {
  const storage = inject(StorageService);
  const documentService = inject(DocumentService);
  const nativeWindow = inject(WindowService).nativeWindow;

  const stored = storage.getItem(STORAGE_KEY);
  const mode = shallowRef<ThemeMode>(isMode(stored) ? stored : 'system');
  const prefersDark = nativeWindow?.matchMedia?.('(prefers-color-scheme: dark)');
  const systemIsDark = shallowRef(prefersDark?.matches ?? false);

  const resolved = computed<'light' | 'dark'>(() =>
    mode.value === 'system' ? (systemIsDark.value ? 'dark' : 'light') : mode.value,
  );

  function apply(): void {
    documentService.nativeDocument?.documentElement.setAttribute('data-bs-theme', resolved.value);
  }

  const onSystemChange = (event: MediaQueryListEvent): void => {
    systemIsDark.value = event.matches;
    if (mode.value === 'system') apply();
  };

  onServiceDestroy(() => prefersDark?.removeEventListener('change', onSystemChange));

  return {
    mode: computed(() => mode.value) as ComputedRef<ThemeMode>,
    /** What is actually on screen, with `system` resolved. */
    resolved,

    /** Applies the stored choice. The app initializer calls it. */
    init: (): void => {
      prefersDark?.addEventListener('change', onSystemChange);
      apply();
    },

    /** @param next Which mode to switch to */
    set: (next: ThemeMode): void => {
      mode.value = next;
      storage.setItem(STORAGE_KEY, next);
      apply();
    },

    /** Straight from whatever is on screen to the other one. */
    toggle: (): void => {
      const next: ThemeMode = resolved.value === 'dark' ? 'light' : 'dark';
      mode.value = next;
      storage.setItem(STORAGE_KEY, next);
      apply();
    },
  };
});
export type ThemeModeService = ServiceOf<typeof ThemeModeService>;

export const useThemeMode = (): ThemeModeService => inject(ThemeModeService);
