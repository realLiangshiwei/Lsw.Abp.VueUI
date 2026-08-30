import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../../di/injector';
import { CookieService } from './cookie.service';
import { DocumentService } from './document.service';
import { StorageService } from './storage.service';
import { WindowService } from './window.service';

// The default test environment is Node, so this file runs with no browser at all — the
// same conditions a server renderer imposes (SSR constraint S2).
const injector = () => createInjector([]);

describe('with no browser', () => {
  it('window and document report that they are not there', () => {
    expect(injector().get(WindowService).nativeWindow).toBeUndefined();
    expect(injector().get(DocumentService).nativeDocument).toBeUndefined();
  });

  it('opening a window, setting the title and the direction all become no-ops', () => {
    const services = injector();

    expect(() => services.get(WindowService).open('https://abp.io')).not.toThrow();
    expect(() => services.get(DocumentService).setTitle('BookStore')).not.toThrow();
    expect(() => services.get(DocumentService).setDir('rtl')).not.toThrow();
  });

  it('storage falls back to memory and reads and writes as usual', () => {
    const storage = injector().get(StorageService);

    storage.setItem('lang', 'fi');

    expect(storage.getItem('lang')).toBe('fi');
  });

  it('unsubscribing from the cross-tab notification does not throw', () => {
    const stop = injector().get(StorageService).onChange(vi.fn());

    expect(() => stop()).not.toThrow();
  });

  it('a cookie reads as undefined and writing does not throw', () => {
    const cookies = injector().get(CookieService);

    expect(() => cookies.set('lang', 'fi')).not.toThrow();
    expect(cookies.get('lang')).toBeUndefined();
  });
});

/**
 * V5 of the milestone: importing the package and building its services must not touch a
 * browser. This file runs under Node, so an accidental `window` at module scope or in a
 * factory fails here rather than in someone's server renderer.
 */
describe('loading the whole package under Node', () => {
  it('importing the barrel touches no browser', async () => {
    await expect(import('../../index')).resolves.toBeDefined();
  });

  it('building every service touches no browser', async () => {
    const core = await import('../../index');
    const services = createInjector([]);

    expect(() => {
      services.get(core.ConfigStateService);
      services.get(core.LocalizationService);
      services.get(core.PermissionService);
      services.get(core.RoutesService);
      services.get(core.SessionStateService);
      services.get(core.MultiTenancyService);
      services.get(core.RestService);
      services.get(core.CurrentUserService);
      services.get(core.SettingService);
      services.get(core.FeatureService);
      services.get(core.ReplaceableComponentsService);
    }).not.toThrow();
  });

  it('session state initialises with no storage at all', async () => {
    const core = await import('../../index');
    const session = createInjector([]).get(core.SessionStateService);

    expect(() => session.init()).not.toThrow();
    expect(session.getLanguage()).toBeNull();
  });
});
