import { createInjector, MemoryTokenStorage } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { TokenStateStore } from './token-state-store.js';

function store(prefix = 'oidc.') {
  const storage = createInjector([]).get(MemoryTokenStorage);
  return { storage, store: new TokenStateStore(storage, prefix) };
}

describe('the state store handed to oidc-client-ts', () => {
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
