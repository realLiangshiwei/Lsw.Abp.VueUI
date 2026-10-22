// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInjector } from '../../di/injector.js';
import { CookieService } from './cookie.service.js';
import { DocumentService } from './document.service.js';
import { StorageService } from './storage.service.js';
import { WindowService } from './window.service.js';

const injector = () => createInjector([]);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('WindowService', () => {
  it('window is there in a browser', () => {
    expect(injector().get(WindowService).nativeWindow).toBe(window);
  });

  it('open does not hand over the opener by default', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    injector().get(WindowService).open('https://abp.io');

    expect(open).toHaveBeenCalledWith('https://abp.io', '_blank', 'noopener,noreferrer');
  });

  it('downloads a blob with its filename and releases the temporary link and URL', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:synthetic-download');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = createObjectURL;
        static override revokeObjectURL = revokeObjectURL;
      },
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe('UserList.csv');
      expect(this.href).toBe('blob:synthetic-download');
    });
    const file = new Blob(['synthetic']);

    injector().get(WindowService).downloadBlob(file, 'UserList.csv');

    expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(file);
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:synthetic-download');
  });

  it('still releases download resources when the browser rejects the click', () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = () => 'blob:synthetic-download';
        static override revokeObjectURL = revokeObjectURL;
      },
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new TypeError('The synthetic browser rejected the download.');
    });

    expect(() => injector().get(WindowService).downloadBlob(new Blob(), 'UserList.csv')).toThrow(
      'rejected',
    );
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:synthetic-download');
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

  it('sets the document language', () => {
    injector().get(DocumentService).setLang?.('ar');

    expect(document.documentElement.getAttribute('lang')).toBe('ar');
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

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'lang',
        newValue: 'ar',
        storageArea: window.localStorage,
      }),
    );

    expect(seen).toHaveBeenCalledWith('lang', 'ar');
  });

  it('does not report another document session storage as a local storage write', () => {
    const storage = injector().get(StorageService);
    const seen = vi.fn();
    const stop = storage.onChange(seen);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'access_token',
        newValue: 'other',
        storageArea: window.sessionStorage,
      }),
    );
    expect(seen).not.toHaveBeenCalled();
    stop();
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
