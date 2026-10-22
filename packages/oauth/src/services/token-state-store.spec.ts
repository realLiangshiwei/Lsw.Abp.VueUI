import { createInjector, MemoryTokenStorage } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { TokenStateStore } from './token-state-store.js';

function store(prefix = 'oidc.') {
  const storage = createInjector([]).get(MemoryTokenStorage);
  return { storage, store: new TokenStateStore(storage, prefix) };
}

describe('the state store handed to oidc-client-ts', () => {
  it('prevents a retired manager from reading or overwriting the replacement session', async () => {
    const { storage } = store();
    let active = true;
    const retired = new TokenStateStore(storage, 'oidc.user.', () => active);
    await retired.set('client', 'original');
    active = false;
    storage.setItem('oidc.user.client', 'replacement');
    await retired.set('client', 'late-original');
    await expect(retired.remove('client')).resolves.toBeNull();
    await expect(retired.get('client')).resolves.toBeNull();
    await expect(retired.getAllKeys()).resolves.toEqual([]);
    expect(storage.getItem('oidc.user.client')).toBe('replacement');
  });

  it('reads, writes and removes through the storage the host chose', async () => {
    const { storage, store: state } = store();

    await state.set('nonce', 'abc');

    expect(storage.getItem('oidc.nonce')).toBe('abc');
    await expect(state.get('nonce')).resolves.toBe('abc');

    await expect(state.remove('nonce')).resolves.toBe('abc');
    await expect(state.get('nonce')).resolves.toBeNull();
  });

  it('lists only the keys under its own prefix, leaving other tokens alone', async () => {
    const { storage, store: state } = store();
    storage.setItem('access_token', 'not-mine');
    await state.set('nonce', 'abc');
    await state.set('state.1', 'def');

    await expect(state.getAllKeys()).resolves.toEqual(['nonce', 'state.1']);
  });
});
