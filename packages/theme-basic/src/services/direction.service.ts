import {
  ConfigStateService,
  defineService,
  DocumentService,
  inject,
  LocalizationService,
  onServiceDestroy,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, type ComputedRef } from 'vue';

/**
 * Which way the document reads. ABP says so per language in
 * `localization.currentCulture.isRightToLeft`, so switching to Arabic flips the whole
 * application and every logical CSS property in it.
 */
export const DirectionService = defineService('DirectionService', () => {
  const configState = inject(ConfigStateService);
  const documentService = inject(DocumentService);
  const localization = inject(LocalizationService);

  const direction = computed<'ltr' | 'rtl'>(() =>
    configState.getOne('localization').value.currentCulture.isRightToLeft ? 'rtl' : 'ltr',
  );

  function apply(): void {
    documentService.setDir(direction.value);
  }

  let stop: (() => void) | null = null;
  onServiceDestroy(() => {
    stop?.();
    stop = null;
  });

  return {
    direction: direction as ComputedRef<'ltr' | 'rtl'>,

    /** Applies it now and after every language change. The app initializer calls it. */
    init: (): void => {
      apply();
      stop ??= localization.onLanguageChange(apply);
    },
  };
});
export type DirectionService = ServiceOf<typeof DirectionService>;

export const useDirection = (): DirectionService => inject(DirectionService);
