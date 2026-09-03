import { defineService, type InjectionToken } from '../../di/token.js';

export interface StorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Every key currently stored, for a consumer that has to find its own among them. */
  keys(): string[];
  /**
   * Reports writes made by another tab to the same origin.
   * @param callback Receives the key and its new value; `null` for a cleared store
   * @returns Stops listening
   */
  onChange(callback: (key: string | null, value: string | null) => void): () => void;
}

type Fallback = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & Pick<StorageService, 'keys'>;

/** Storage is unavailable in a server renderer, and throws in Safari's private mode. */
function memoryStorage(): Fallback {
  const values = new Map<string, string>();

  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: key => void values.delete(key),
    keys: () => [...values.keys()],
  };
}

/** `localStorage` exposes its keys as own properties, which is the only way to list them. */
function nativeStorage(native: Storage): Fallback {
  return {
    getItem: key => native.getItem(key),
    setItem: (key, value) => native.setItem(key, value),
    removeItem: key => native.removeItem(key),
    keys: () => Object.keys(native),
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
    const storage = available() ? nativeStorage(window.localStorage) : memoryStorage();

    return {
      ...storage,
      onChange: callback => {
        if (typeof window === 'undefined') return () => {};

        const listener = (event: StorageEvent) => callback(event.key, event.newValue);
        window.addEventListener('storage', listener);
        return () => window.removeEventListener('storage', listener);
      },
    };
  },
);
