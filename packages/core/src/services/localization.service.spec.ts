import { describe, expect, it, vi } from 'vitest';
import { createInjector, type Injector } from '../di/injector';
import type { ProviderInput } from '../di/provider';
import { resolveRootOptions, type AbpRootOptions } from '../models/root-options';
import type { ApplicationConfigurationDto } from '../proxy/models';
import { HTTP_FETCH, type FetchLike } from '../tokens/http.token';
import { LOCALIZATIONS } from '../tokens/localization.token';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';
import { ConfigStateService } from './config-state.service';
import { LocalizationService } from './localization.service';
import { SessionStateService } from './session-state.service';

const environment = {
  apis: { default: { url: '' } },
  application: { name: 'x' },
  production: false,
};

function localizationConfig(overrides: Partial<ApplicationConfigurationDto['localization']> = {}) {
  return {
    values: {},
    resources: {
      AbpUi: { texts: { Save: 'Save', Cancel: 'Cancel' }, baseResources: [] },
      BookStore: {
        texts: { Menu: 'Menu', Welcome: 'Welcome {0}, you have {1} books' },
        baseResources: ['AbpUi'],
      },
    },
    languages: [{ cultureName: 'en', displayName: 'English' }],
    currentCulture: { cultureName: 'en', isRightToLeft: false, dateTimeFormat: {} },
    defaultResourceName: 'BookStore',
    languagesMap: {},
    languageFilesMap: {},
    useRouteBasedCulture: false,
    ...overrides,
  } as ApplicationConfigurationDto['localization'];
}

function context(
  options: Partial<AbpRootOptions> = {},
  providers: ProviderInput[] = [],
  responder: FetchLike = () => Promise.resolve(new Response('{}')),
): Injector {
  const injector = createInjector([
    { provide: ABP_ROOT_OPTIONS, useValue: resolveRootOptions({ environment, ...options }) },
    { provide: HTTP_FETCH, useValue: responder },
    ...providers,
  ]);

  const configState = injector.get(ConfigStateService);
  configState.setState({ ...configState.snapshot(), localization: localizationConfig() });
  injector.get(SessionStateService).init();

  return injector;
}

describe('resolving text', () => {
  const t = (key: Parameters<ReturnType<typeof localization>['t']>[0], ...params: unknown[]) =>
    localization().t(key, ...params);
  const localization = () => context().get(LocalizationService);

  it('reads by resource::key', () => {
    expect(t('AbpUi::Save')).toBe('Save');
  });

  it('the configured default resource is used when the resource name is left out', () => {
    expect(t('::Menu')).toBe('Menu');
  });

  it('a resource name of _ makes the key the text itself', () => {
    expect(t('_::Already translated')).toBe('Already translated');
  });

  it('a string without :: comes back unchanged', () => {
    expect(t('Just a label')).toBe('Just a label');
  });

  it('falls back to the default text, and to the key when there is none', () => {
    expect(t({ key: 'AbpUi::Missing', defaultValue: 'Fallback' })).toBe('Fallback');
    expect(t('AbpUi::Missing')).toBe('Missing');
  });

  it('a missing resource warns once and falls back to the key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(t('Nope::Key')).toBe('Key');

    warn.mockRestore();
  });

  it('interpolates by {0} and {1}', () => {
    expect(t('BookStore::Welcome', 'Ada', 3)).toBe('Welcome Ada, you have 3 books');
  });

  it('a missing parameter leaves its placeholder in place', () => {
    expect(t('BookStore::Welcome', 'Ada')).toBe('Welcome Ada, you have {1} books');
  });

  it('an inherited resource is found too', () => {
    expect(t('BookStore::Save')).toBe('Save');
  });

  it('text of its own hides what it inherited', () => {
    const injector = context();
    const configState = injector.get(ConfigStateService);
    configState.setState({
      ...configState.snapshot(),
      localization: localizationConfig({
        resources: {
          AbpUi: { texts: { Save: 'Save' }, baseResources: [] },
          BookStore: { texts: { Save: 'Store it' }, baseResources: ['AbpUi'] },
        },
      }),
    });

    expect(injector.get(LocalizationService).t('BookStore::Save')).toBe('Store it');
  });

  it('text shipped with the application hides the text from the backend', () => {
    const injector = context({}, [
      {
        provide: LOCALIZATIONS,
        multi: true,
        useValue: {
          culture: 'en',
          resources: [{ resourceName: 'AbpUi', texts: { Save: 'Keep' } }],
        },
      },
    ]);

    expect(injector.get(LocalizationService).t('AbpUi::Save')).toBe('Keep');
  });

  it('text in another language does not take part', () => {
    const injector = context({}, [
      {
        provide: LOCALIZATIONS,
        multi: true,
        useValue: {
          culture: 'tr',
          resources: [{ resourceName: 'AbpUi', texts: { Save: 'Kaydet' } }],
        },
      },
    ]);

    expect(injector.get(LocalizationService).t('AbpUi::Save')).toBe('Save');
  });
});

describe('reactivity', () => {
  it('tr follows the configuration', () => {
    const injector = context();
    const text = injector.get(LocalizationService).tr('AbpUi::Save');
    const configState = injector.get(ConfigStateService);

    expect(text.value).toBe('Save');

    configState.setState({
      ...configState.snapshot(),
      localization: localizationConfig({
        resources: { AbpUi: { texts: { Save: 'Kaydet' }, baseResources: [] } },
      }),
    });

    expect(text.value).toBe('Kaydet');
  });

  it('the list of languages comes from the configuration', () => {
    expect(context().get(LocalizationService).languages.value).toHaveLength(1);
  });
});

describe('changing the language', () => {
  const turkish = {
    resources: { AbpUi: { texts: { Save: 'Kaydet' }, baseResources: [] } },
    currentCulture: { cultureName: 'tr', isRightToLeft: false, dateTimeFormat: {} },
  };

  it('stores the choice, fetches the texts of that language, then reports it', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response(JSON.stringify(turkish))));
    const injector = context({}, [], send);
    const localization = injector.get(LocalizationService);
    const changed = vi.fn();
    localization.onLanguageChange(changed);

    await localization.setLanguage('tr');

    expect(injector.get(SessionStateService).getLanguage()).toBe('tr');
    expect(String(send.mock.calls[0]?.[0])).toContain('cultureName=tr');
    expect(localization.t('AbpUi::Save')).toBe('Kaydet');
    expect(changed).toHaveBeenCalledExactlyOnceWith('tr');
  });

  it('changing to the current language sends nothing', async () => {
    const send = vi.fn<FetchLike>(() => Promise.resolve(new Response('{}')));
    const injector = context({}, [], send);

    await injector.get(LocalizationService).setLanguage('en');

    expect(send).not.toHaveBeenCalled();
  });

  it('reads an extra JSON shipped with the application when UI localization is on', async () => {
    const send = vi.fn<FetchLike>(url =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(url).endsWith('/tr.json') ? { AbpUi: { Save: 'From file' } } : turkish,
          ),
        ),
      ),
    );
    const injector = context({ uiLocalization: { enabled: true, basePath: '/texts' } }, [], send);

    await injector.get(LocalizationService).setLanguage('tr');

    expect(send.mock.calls.map(call => String(call[0]))).toContain('/texts/tr.json');
    expect(injector.get(LocalizationService).t('AbpUi::Save')).toBe('From file');
  });

  it('a missing UI text file does not stop the change', async () => {
    const send = vi.fn<FetchLike>(url =>
      String(url).endsWith('.json') && !String(url).includes('api')
        ? Promise.resolve(new Response('not found', { status: 404 }))
        : Promise.resolve(new Response(JSON.stringify(turkish))),
    );
    const injector = context({ uiLocalization: { enabled: true } }, [], send);

    await injector.get(LocalizationService).setLanguage('tr');

    expect(injector.get(LocalizationService).t('AbpUi::Save')).toBe('Kaydet');
  });
});
