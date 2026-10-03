import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector.js';
import { runInInjectionContext } from '../di/inject.js';
import { ConfigStateService } from '../services/config-state.service.js';
import { StorageService } from '../services/platform/storage.service.js';
import { clearListPreferences, useListPreferences } from './list-preferences.js';

describe('list preferences', () => {
  it('clears every list of the signed-out user and keeps other users and unrelated keys', () => {
    const injector = createInjector([]);
    const storage = injector.get(StorageService);
    const keys = ['abpvue.list.Users.user-a', 'abpvue.list.Roles.user-a'];
    for (const key of [...keys, 'abpvue.list.Users.user-b', 'abpvue.list.Users.anonymous', 'token'])
      storage.setItem(key, '{}');

    clearListPreferences(storage, 'user-a');

    expect(keys.map(key => storage.getItem(key))).toEqual([null, null]);
    expect(storage.getItem('abpvue.list.Users.user-b')).toBe('{}');
    expect(storage.getItem('abpvue.list.Users.anonymous')).toBe('{}');
    expect(storage.getItem('token')).toBe('{}');
  });

  it.each(['null', '[]', 'true', '{broken', '{"maxResultCount":-1,"hiddenColumns":7}'])(
    'falls back silently for invalid preferences: %s',
    raw => {
      const injector = createInjector([]);
      const storage = injector.get(StorageService);
      storage.setItem('abpvue.list.Users.anonymous', raw);
      const preferences = runInInjectionContext(injector, () => useListPreferences('Users'));

      expect(preferences.read()).toEqual({});
    },
  );

  it('stores preferences without carrying query intent or invalid columns forward', () => {
    const injector = createInjector([]);
    injector.get(ConfigStateService);
    const storage = injector.get(StorageService);
    storage.setItem(
      'abpvue.list.Users.anonymous',
      JSON.stringify({ page: 4, filter: 'Alice', hiddenColumns: ['email', 'email', 7] }),
    );
    const preferences = runInInjectionContext(injector, () => useListPreferences('Users'));
    preferences.patch({ maxResultCount: 25, sortOrder: 'asc' });

    expect(preferences.read()).toEqual({
      maxResultCount: 25,
      sortOrder: 'asc',
      hiddenColumns: ['email'],
    });
  });
});
