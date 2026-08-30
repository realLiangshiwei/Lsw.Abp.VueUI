import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector';
import { TokenStorage } from '../tokens/auth.token';
import { StorageService } from './platform/storage.service';
import {
  BrowserTokenStorage,
  MemoryTokenStorage,
  ServerTokenStorage,
} from './token-storage.service';

describe('token storage', () => {
  it('the default one is the browser storage', () => {
    const injector = createInjector([]);

    expect(injector.get(TokenStorage)).toBe(injector.get(BrowserTokenStorage));
  });

  it('the browser storage writes through StorageService, so another tab sees the same session', () => {
    const injector = createInjector([]);

    injector.get(BrowserTokenStorage).setItem('access_token', 'abc');

    expect(injector.get(StorageService).getItem('access_token')).toBe('abc');
  });

  it('withTokenStorage on the memory one keeps tokens out of storage', () => {
    const injector = createInjector([{ provide: TokenStorage, useExisting: MemoryTokenStorage }]);

    injector.get(TokenStorage).setItem('access_token', 'abc');

    expect(injector.get(TokenStorage).getItem('access_token')).toBe('abc');
    expect(injector.get(StorageService).getItem('access_token')).toBeNull();
  });

  it('the memory storage lists the keys it wrote', () => {
    const storage = createInjector([]).get(MemoryTokenStorage);

    storage.setItem('access_token', 'abc');
    storage.setItem('refresh_token', 'def');
    storage.removeItem('access_token');

    expect(storage.keys()).toEqual(['refresh_token']);
  });

  it('the server one keeps nothing: what is written cannot be read back', () => {
    const storage = createInjector([]).get(ServerTokenStorage);

    storage.setItem('access_token', 'abc');

    expect(storage.getItem('access_token')).toBeNull();
    expect(storage.keys()).toEqual([]);
  });
});
