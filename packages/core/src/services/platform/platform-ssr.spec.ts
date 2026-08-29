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
