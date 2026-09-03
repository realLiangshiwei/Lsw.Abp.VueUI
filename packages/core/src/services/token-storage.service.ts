import { inject } from '../di/inject.js';
import { defineService, type InjectionToken } from '../di/token.js';
import type { TokenStorage } from '../tokens/auth.token.js';
import { StorageService } from './platform/storage.service.js';

/**
 * Tokens in local storage: they survive a reload, and every tab of the application sees
 * the same session. Anything running in the page can read them, so an application that
 * would rather pay a redirect on every reload passes `withTokenStorage(MemoryTokenStorage)`.
 */
export const BrowserTokenStorage: InjectionToken<TokenStorage> = defineService(
  'BrowserTokenStorage',
  (): TokenStorage => inject(StorageService),
);

/** Tokens for this document only: gone on reload, invisible to another tab. */
export const MemoryTokenStorage: InjectionToken<TokenStorage> = defineService(
  'MemoryTokenStorage',
  (): TokenStorage => {
    const values = new Map<string, string>();

    return {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: key => void values.delete(key),
      keys: () => [...values.keys()],
    };
  },
);

/**
 * Holds nothing. A server renderer has no session of its own to keep, and writing one
 * would leak it into the next request.
 */
export const ServerTokenStorage: InjectionToken<TokenStorage> = defineService(
  'ServerTokenStorage',
  (): TokenStorage => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    keys: () => [],
  }),
);
