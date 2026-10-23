import { ConfigStateService, defineToken, inject } from '@lsw-abpvue/core';
import { computed, type ComputedRef } from 'vue';

/** Controls language management availability in navigation and routes. */
export const LANGUAGE_MANAGEMENT_FEATURES = defineToken<ComputedRef<{ enable: boolean }>>(
  'LANGUAGE_MANAGEMENT_FEATURES',
  {
    factory: () => {
      const config = inject(ConfigStateService);
      return computed(() => ({
        enable:
          config.snapshot().features.values['LanguageManagement.Enable']?.toLowerCase() !== 'false',
      }));
    },
  },
);
