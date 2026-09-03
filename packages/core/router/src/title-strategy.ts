import {
  ABP_ROOT_OPTIONS,
  defineToken,
  DocumentService,
  inject,
  LocalizationService,
} from '@lsw-abpvue/core';
import type { TitleStrategy } from './tokens.js';

/**
 * `Users | BookStore`, with both halves localized. A route without a title leaves the
 * application name alone.
 */
export const TITLE_STRATEGY = defineToken<TitleStrategy>('TITLE_STRATEGY', {
  factory: (): TitleStrategy => {
    const localization = inject(LocalizationService);
    const documentService = inject(DocumentService);
    const options = inject(ABP_ROOT_OPTIONS);

    return {
      setTitle: title => {
        const applicationName = options.environment.application.name;
        const localized = title ? localization.t(title) : '';

        if (!localized) {
          documentService.setTitle(applicationName);
          return;
        }

        documentService.setTitle(
          options.disableProjectNameInTitle ? localized : `${localized} | ${applicationName}`,
        );
      },
    };
  },
});
