import { defineService, type InjectionToken } from '../../di/token';

export interface StorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /**
   * Reports writes made by another tab to the same origin.
   * @param callback Receives the key and its new value; `null` for a cleared store
   * @returns Stops listening
   */
  onChange(callback: (key: string | null, value: string | null) => void): () => void;
}

/** Storage is unavailable in a server renderer, and throws in Safari's private mode. */
function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const values = new Map<string, string>();

  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: key => void values.delete(key),
  };
}

function available(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const probe = '__abp_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    // Private browsing and blocked third-party storage both throw on write.
    return false;
  }
}

export const StorageService: InjectionToken<StorageService> = defineService(
  'StorageService',
  (): StorageService => {
    const storage = available() ? window.localStorage : memoryStorage();

    return {
      getItem: key => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: key => storage.removeItem(key),
      onChange: callback => {
        if (typeof window === 'undefined') return () => {};

        const listener = (event: StorageEvent) => callback(event.key, event.newValue);
        window.addEventListener('storage', listener);
        return () => window.removeEventListener('storage', listener);
      },
    };
  },
);
