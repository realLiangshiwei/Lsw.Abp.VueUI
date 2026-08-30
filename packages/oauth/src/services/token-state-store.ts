import type { TokenStorage } from '@lsw-abpvue/core';
import type { StateStore } from 'oidc-client-ts';

/**
 * Lets `oidc-client-ts` keep its state wherever the application decided tokens go.
 * Its own `WebStorageStateStore` reaches for `window.localStorage` directly, which is
 * the one thing `withTokenStorage()` exists to move.
 */
export class TokenStateStore implements StateStore {
  constructor(
    private readonly storage: TokenStorage,
    private readonly prefix: string,
  ) {}

  set(key: string, value: string): Promise<void> {
    this.storage.setItem(this.prefix + key, value);
    return Promise.resolve();
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.storage.getItem(this.prefix + key));
  }

  remove(key: string): Promise<string | null> {
    const value = this.storage.getItem(this.prefix + key);
    this.storage.removeItem(this.prefix + key);
    return Promise.resolve(value);
  }

  getAllKeys(): Promise<string[]> {
    const keys = this.storage
      .keys()
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length));

    return Promise.resolve(keys);
  }
}
