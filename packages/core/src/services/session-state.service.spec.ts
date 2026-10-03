import { describe, expect, it, vi } from 'vitest';
import { createInjector } from '../di/injector.js';
import { CookieService } from './platform/cookie.service.js';
import { DocumentService } from './platform/document.service.js';
import { StorageService } from './platform/storage.service.js';
import { SessionStateService } from './session-state.service.js';

/**
 * A storage that can be poked from the outside, standing in for another tab. The real
 * one, including its `storage` event wiring, is covered in `platform.spec.ts`.
 */
function fakeStorage() {
  const values = new Map<string, string>();
  const listeners = new Set<(key: string | null, value: string | null) => void>();

  return {
    values,
    /** Writes the way another tab would: the value lands and the event follows. */
    writeFromAnotherTab(key: string, value: string) {
      values.set(key, value);
      for (const listener of listeners) listener(key, value);
    },
    service: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
      keys: () => [...values.keys()],
      onChange: (callback: (key: string | null, value: string | null) => void) => {
        listeners.add(callback);
        return () => void listeners.delete(callback);
      },
    } satisfies StorageService,
  };
}

function session(stored?: string) {
  const storage = fakeStorage();
  if (stored !== undefined) storage.values.set('abpSession', stored);

  const cookies = { get: vi.fn(), set: vi.fn(), remove: vi.fn() } satisfies CookieService;
  const browserDocument = {
    nativeDocument: undefined,
    setTitle: vi.fn(),
    setDir: vi.fn(),
    setLang: vi.fn(),
    getBaseUrl: () => '/',
  };
  const service = createInjector([
    { provide: StorageService, useValue: storage.service },
    { provide: CookieService, useValue: cookies },
    { provide: DocumentService, useValue: browserDocument },
  ]).get(SessionStateService);

  return { storage, service, cookies, browserDocument };
}

describe('session state', () => {
  it('restores the document language during initialization without factory side effects', () => {
    const { service, browserDocument } = session(JSON.stringify({ language: 'ar' }));
    expect(browserDocument.setLang).not.toHaveBeenCalled();

    service.init();

    expect(browserDocument.setLang).toHaveBeenCalledExactlyOnceWith('ar');
  });

  it('updates the document language when the choice changes in this or another tab', () => {
    const { service, storage, browserDocument } = session();
    service.init();
    service.setLanguage('zh-Hans');
    expect(browserDocument.setLang).toHaveBeenLastCalledWith('zh-Hans');

    storage.writeFromAnotherTab('abpSession', JSON.stringify({ language: 'ar' }));

    expect(browserDocument.setLang).toHaveBeenLastCalledWith('ar');
  });

  it('accepts a document replacement without the optional language capability', () => {
    const browserDocument = {
      nativeDocument: undefined,
      setTitle: vi.fn(),
      setDir: vi.fn(),
      getBaseUrl: () => '/',
    } satisfies DocumentService;
    const service = createInjector([{ provide: DocumentService, useValue: browserDocument }]).get(
      SessionStateService,
    );
    service.init();

    expect(() => service.setLanguage('ar')).not.toThrow();
    expect(service.getLanguage()).toBe('ar');
  });

  it('synchronizes the persisted language cookie only after initialization', () => {
    const { service, cookies } = session(JSON.stringify({ language: 'en' }));
    expect(cookies.set).not.toHaveBeenCalled();

    service.init();

    expect(cookies.set).toHaveBeenCalledWith('.AspNetCore.Culture', 'c=en|uic=en');
  });

  it('updates the backend culture cookie when the language changes in this or another tab', () => {
    const { service, storage, cookies } = session();
    service.init();
    service.setLanguage('en');
    expect(cookies.set).toHaveBeenLastCalledWith('.AspNetCore.Culture', 'c=en|uic=en');

    storage.writeFromAnotherTab('abpSession', JSON.stringify({ language: 'ar' }));

    expect(cookies.set).toHaveBeenLastCalledWith('.AspNetCore.Culture', 'c=ar|uic=ar');
  });
  it('reads back what the last visit stored, after init', () => {
    const { service } = session(JSON.stringify({ language: 'fi' }));

    service.init();

    expect(service.getLanguage()).toBe('fi');
  });

  it('stores under the same keys as the Angular UI, so switching UI keeps the session', () => {
    const { storage, service } = session();
    service.init();

    service.setLanguage('tr');

    expect(JSON.parse(storage.values.get('abpSession') ?? '{}')).toMatchObject({ language: 'tr' });
  });

  it('stored content that cannot be read counts as nothing and does not stop startup', () => {
    const { service } = session('not json');

    service.init();

    expect(service.getLanguage()).toBeNull();
  });

  it('touches no storage before init', () => {
    const { storage } = session(JSON.stringify({ language: 'fi' }));

    expect(storage.values.size).toBe(1);
  });

  it('a language change is reported and the reactive view follows', () => {
    const { service } = session();
    service.init();
    const seen = vi.fn();
    service.onLanguageChange(seen);
    const language = service.getLanguage$();

    service.setLanguage('ar');

    expect(seen).toHaveBeenCalledExactlyOnceWith('ar');
    expect(language.value).toBe('ar');
  });

  it('a tenant change is reported', () => {
    const { service } = session();
    service.init();
    const seen = vi.fn();
    service.onTenantChange(seen);

    service.setTenant({ id: 'tenant-1', name: 'acme', isAvailable: true });

    expect(seen).toHaveBeenCalledOnce();
    expect(service.getTenant()?.name).toBe('acme');
  });

  it('a session changed in another tab is picked up here', () => {
    const { storage, service } = session();
    service.init();

    storage.writeFromAnotherTab('abpSession', JSON.stringify({ language: 'de' }));

    expect(service.getLanguage()).toBe('de');
  });

  it('a key that belongs to somebody else is ignored', () => {
    const { storage, service } = session();
    service.init();
    service.setLanguage('fi');

    storage.writeFromAnotherTab('somethingElse', 'x');

    expect(service.getLanguage()).toBe('fi');
  });

  it('a session id is generated once and then stays', () => {
    const { service } = session();
    service.init();

    expect(service.getSessionId()).toBe(service.getSessionId());
  });

  it('a second init does not overwrite what has been changed since', () => {
    const { service } = session();
    service.init();
    service.setLanguage('fi');

    service.init();

    expect(service.getLanguage()).toBe('fi');
  });
});
