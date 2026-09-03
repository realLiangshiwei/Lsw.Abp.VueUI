import { defineToken } from '../di/token.js';
import {
  DEFAULT_ENVIRONMENT,
  resolveRootOptions,
  type ResolvedRootOptions,
} from '../models/root-options.js';

/**
 * The host's root options with every default applied. Without `withOptions()` the API
 * base URL is empty, which means same-origin requests — the right guess for an
 * application served by the backend itself.
 */
export const ABP_ROOT_OPTIONS = defineToken<ResolvedRootOptions>('ABP_ROOT_OPTIONS', {
  factory: () => resolveRootOptions({ environment: DEFAULT_ENVIRONMENT }),
  hint: 'Configure it with provideAbpCore(withOptions({ environment })).',
});
