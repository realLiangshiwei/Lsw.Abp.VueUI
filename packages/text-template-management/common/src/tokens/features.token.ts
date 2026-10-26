import { ConfigStateService, defineToken, inject } from '@lsw-abpvue/core';
import { computed, type ComputedRef } from 'vue';

/** Controls text template availability in navigation and routes. */
export const TEXT_TEMPLATE_MANAGEMENT_FEATURES = defineToken<ComputedRef<{ enable: boolean }>>(
  'TEXT_TEMPLATE_MANAGEMENT_FEATURES',
  {
    factory: () => {
      const config = inject(ConfigStateService);
      return computed(() => ({
        enable:
          config.snapshot().features.values['TextManagement.Enable']?.toLowerCase() !== 'false',
      }));
    },
  },
);
