import { defineService, inject, WindowService, type ServiceOf } from '@lsw-abpvue/core';
import { ABP_ROUTER } from '@lsw-abpvue/core/router';

/**
 * Where authentication sends people. The router does it when the application has one;
 * without it the browser does, which costs a reload but is better than going nowhere.
 */
export const AuthNavigationService = defineService('AuthNavigationService', () => {
  const router = inject(ABP_ROUTER, { optional: true });
  const windowService = inject(WindowService);

  return {
    go: async (path: string): Promise<void> => {
      if (router) {
        await router.replace(path);
        return;
      }

      windowService.nativeWindow?.location.assign(path);
    },

    /**
     * Rewrites the address bar without navigating, which is how the authorization
     * callback's query string is cleared before the router ever reads it.
     */
    replaceUrl: (url: string): void => {
      windowService.nativeWindow?.history.replaceState(null, '', url);
    },

    currentUrl: (): string | undefined => windowService.nativeWindow?.location.href,
  };
});
export type AuthNavigationService = ServiceOf<typeof AuthNavigationService>;
