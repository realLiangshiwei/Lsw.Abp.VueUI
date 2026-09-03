import { defineToken } from '../di/token.js';
import type { AbpLocalization } from '../models/localization.js';

/** Texts shipped with the application, contributed by any package. */
export const LOCALIZATIONS = defineToken<AbpLocalization[]>('LOCALIZATIONS', { multi: true });

/**
 * Called when the language changes, for whatever else the application has to switch --
 * a date library's locale, most often. `Intl` needs nothing, so the default does nothing.
 */
export const REGISTER_LOCALE = defineToken<(culture: string) => Promise<void>>('REGISTER_LOCALE', {
  factory: () => () => Promise.resolve(),
});
