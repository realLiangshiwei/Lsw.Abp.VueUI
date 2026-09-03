// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../../di/injector.js';
import { CookieService } from './cookie.service.js';
import { DocumentService } from './document.service.js';
import { StorageService } from './storage.service.js';
import { WindowService } from './window.service.js';

const injector = () => createInjector([]);

describe('WindowService', () => {
  it('window is there in a browser', () => {
    expect(injector().get(WindowService).nativeWindow).toBe(window);
  });

  it('open does not hand over the opener by default', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    injector().get(WindowService).open('https://abp.io');

    expect(open).toHaveBeenCalledWith('https://abp.io', '_blank', 'noopener,noreferrer');
  });
});

describe('DocumentService', () => {
  it('sets the title', () => {
    injector().get(DocumentService).setTitle('BookStore');

    expect(document.title).toBe('BookStore');
  });

  it('sets the writing direction', () => {
    injector().get(DocumentService).setDir('rtl');

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('the base URL is the root with no base tag', () => {
    expect(injector().get(DocumentService).getBaseUrl()).toBe('/');
  });
});

describe('StorageService', () => {
  it('writes and reads back', () => {
    const storage = injector().get(StorageService);

    storage.setItem('lang', 'fi');

    expect(storage.getItem('lang')).toBe('fi');
    expect(window.localStorage.getItem('lang')).toBe('fi');
  });

  it('reads back null once removed', () => {
    const storage = injector().get(StorageService);
    storage.setItem('lang', 'fi');

    storage.removeItem('lang');

    expect(storage.getItem('lang')).toBeNull();
  });

  it('lists the keys it holds, which is how the authentication package finds its own', () => {
    const storage = injector().get(StorageService);

    storage.setItem('access_token', 'abc');

    expect(storage.keys()).toContain('access_token');
  });

  it('a write from another tab is reported', () => {
    const storage = injector().get(StorageService);
    const seen = vi.fn();
    storage.onChange(seen);

    window.dispatchEvent(new StorageEvent('storage', { key: 'lang', newValue: 'ar' }));

    expect(seen).toHaveBeenCalledWith('lang', 'ar');
  });

  it('stops reporting once unsubscribed', () => {
    const storage = injector().get(StorageService);
    const seen = vi.fn();
    const stop = storage.onChange(seen);

    stop();
    window.dispatchEvent(new StorageEvent('storage', { key: 'lang', newValue: 'ar' }));

    expect(seen).not.toHaveBeenCalled();
  });
});

describe('CookieService', () => {
  it('writes and reads back, encoded', () => {
    const cookies = injector().get(CookieService);

    cookies.set('XSRF-TOKEN', 'a b/c');

    expect(cookies.get('XSRF-TOKEN')).toBe('a b/c');
  });

  it('a cookie that is not there reads as undefined', () => {
    expect(injector().get(CookieService).get('missing')).toBeUndefined();
  });

  it('removal is an expiry in the past', () => {
    const cookies = injector().get(CookieService);
    cookies.set('lang', 'fi');

    cookies.remove('lang');

    expect(cookies.get('lang')).toBeUndefined();
  });

  it('the options really apply: another path cannot read it', () => {
    const cookies = injector().get(CookieService);

    cookies.set('scoped', 'yes', { path: '/admin', sameSite: 'Strict' });

    expect(cookies.get('scoped')).toBeUndefined();
  });
});
