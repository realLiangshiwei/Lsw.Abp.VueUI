import {
  defineService,
  getCurrentInjector,
  inject,
  WindowService,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { ABP_ROUTER } from '@lsw-abpvue/core/router';

/**
 * Where authentication sends people. The router does it when the application has one;
 * without it the browser does, which costs a reload but is better than going nowhere.
 */
export const AuthNavigationService = defineService('AuthNavigationService', () => {
  const injector = getCurrentInjector();
  const windowService = inject(WindowService);

  // Asked for on use rather than injected here: building the router makes vue-router read
  // the address bar, and during startup that still holds the authorization callback this
  // service is about to clean out of it.
  const router = () => injector?.get(ABP_ROUTER, null, { optional: true }) ?? null;

  return {
    go: async (path: string): Promise<void> => {
      const target = router();
      if (target) {
        await target.replace(path);
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
