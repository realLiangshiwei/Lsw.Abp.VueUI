import { createInjector, MemoryTokenStorage, TokenStorage } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { AuthStateService, toTokens } from './auth-state.service.js';

function state() {
  const injector = createInjector([{ provide: TokenStorage, useExisting: MemoryTokenStorage }]);
  return { storage: injector.get(TokenStorage), service: injector.get(AuthStateService) };
}

describe('token state', () => {
  it('nobody is signed in to begin with', () => {
    expect(state().service.isAuthenticated.value).toBe(false);
  });

  it('a stored token means somebody is signed in', () => {
    const { service } = state();

    service.persist({ accessToken: 'abc', refreshToken: 'def', expiresAt: Date.now() + 3600_000 });

    expect(service.isAuthenticated.value).toBe(true);
    expect(service.getAccessToken()).toBe('abc');
    expect(service.getRefreshToken()).toBe('def');
  });

  it('stores under the same keys as the Angular UI, so switching UI on one origin keeps the session', () => {
    const { storage, service } = state();

    service.persist({ accessToken: 'abc', refreshToken: 'def', expiresAt: 1000 });

    expect(storage.getItem('access_token')).toBe('abc');
    expect(storage.getItem('refresh_token')).toBe('def');
    expect(storage.getItem('expires_at')).toBe('1000');
  });

  it('reads back on a reload', () => {
    const { storage, service } = state();
    storage.setItem('access_token', 'abc');
    storage.setItem('refresh_token', 'def');
    storage.setItem('expires_at', '1000');

    expect(service.restore()).toEqual({ accessToken: 'abc', refreshToken: 'def', expiresAt: 1000 });
    expect(service.isAuthenticated.value).toBe(true);
  });

  it('an expiry that cannot be read counts as expired rather than never', () => {
    const { storage, service } = state();
    storage.setItem('access_token', 'abc');
    storage.setItem('expires_at', 'not-a-number');

    expect(service.restore()?.expiresAt).toBe(0);
  });

  it('a token with no expiry counts as expired too -- not knowing means fetching a new one', () => {
    const { storage, service } = state();
    storage.setItem('access_token', 'abc');

    expect(service.restore()?.expiresAt).toBe(0);
  });

  it('a stored never-expires, which is what a backend that gave no lifetime produces, reads back', () => {
    const { service } = state();
    service.persist({ accessToken: 'abc', refreshToken: undefined, expiresAt: Infinity });

    expect(service.restore()?.expiresAt).toBe(Infinity);
  });

  it('reads back null when nothing was ever stored', () => {
    expect(state().service.restore()).toBeNull();
  });

  it('not one key is left in storage once it is cleared', () => {
    const { storage, service } = state();
    service.persist({ accessToken: 'abc', refreshToken: 'def', expiresAt: 1000 });

    service.persist(null);

    expect(storage.keys()).toEqual([]);
    expect(service.isAuthenticated.value).toBe(false);
  });

  it('a new token without a refresh_token does not leave the old one behind', () => {
    const { storage, service } = state();
    service.persist({ accessToken: 'abc', refreshToken: 'def', expiresAt: 1000 });

    service.persist({ accessToken: 'ghi', refreshToken: undefined, expiresAt: 2000 });

    expect(storage.getItem('refresh_token')).toBeNull();
  });
});

describe('turning a token response into an expiry', () => {
  it('expires_in is a number of seconds from now', () => {
    const before = Date.now();

    const tokens = toTokens({ access_token: 'abc', expires_in: 3600 });

    expect(tokens.expiresAt).toBeGreaterThanOrEqual(before + 3600_000);
    expect(tokens.expiresAt).toBeLessThan(before + 3601_000);
  });

  it('no stated lifetime means it does not expire', () => {
    expect(toTokens({ access_token: 'abc' }).expiresAt).toBe(Infinity);
  });
});
