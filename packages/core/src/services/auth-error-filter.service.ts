import { defineService, type ServiceOf } from '../di/token.js';
import { inject } from '../di/inject.js';
import type { AuthErrorFilter } from '../models/auth.js';
import type { AbpHttpError } from '../models/http.js';

/**
 * The rules that decide whether a failed request means the session is over. An
 * authentication package asks `run()` before it clears the tokens; a module that has its
 * own answer for some endpoint registers a filter instead of patching the package.
 *
 * @see AuthErrorFilterService in `@abp/ng.core`, which is abstract there and errors until
 * `@abp/ng.oauth` replaces it
 */
export const AuthErrorFilterService = defineService('AuthErrorFilterService', () => {
  const filters = new Map<string, AuthErrorFilter>();

  return {
    get: (id: string): AuthErrorFilter | undefined => filters.get(id),

    add: (filter: AuthErrorFilter): void => void filters.set(filter.id, filter),

    /** @param item Fields to change on the filter with this `id`; unknown ids are ignored */
    patch: (item: Partial<AuthErrorFilter> & Pick<AuthErrorFilter, 'id'>): void => {
      const existing = filters.get(item.id);
      if (existing) filters.set(item.id, { ...existing, ...item });
    },

    remove: (id: string): void => void filters.delete(id),

    /**
     * @param error The failure to judge
     * @returns `true` when a filter claims the failure, meaning the session stays
     */
    run: (error: AbpHttpError): boolean =>
      [...filters.values()].some(filter => filter.executable && filter.execute(error)),
  };
});
export type AuthErrorFilterService = ServiceOf<typeof AuthErrorFilterService>;

export const useAuthErrorFilter = (): AuthErrorFilterService => inject(AuthErrorFilterService);
