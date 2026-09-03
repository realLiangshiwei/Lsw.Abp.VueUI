import { describe, expect, it, vi } from 'vitest';
import { DuplicateFeatureError } from '../di/errors.js';
import { createInjector, type Injector } from '../di/injector.js';
import type { Environment } from '../models/environment.js';
import { LocalizationService } from '../services/localization.service.js';
import { RoutesService } from '../services/routes.service.js';
import { SessionStateService } from '../services/session-state.service.js';
import { HTTP_INTERCEPTORS } from '../tokens/http.token.js';
import { LOCALIZATIONS, REGISTER_LOCALE } from '../tokens/localization.token.js';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token.js';
import {
  provideAbpCore,
  withCompareFunc,
  withLocalizations,
  withOptions,
  withRegisterLocale,
} from './core.provider.js';

const environment: Environment = {
  apis: { default: { url: 'https://backend' } },
  application: { name: 'BookStore' },
  production: false,
};

const texts = (culture: string, save: string) => ({
  culture,
  resources: [{ resourceName: 'AbpUi', texts: { Save: save } }],
});

/**
 * Shipped texts are matched by exact culture name, as in Angular, so the session has to
 * know which language it is in before they apply.
 */
function speaking(injector: Injector, culture: string): Injector {
  injector.get(SessionStateService).init();
  injector.get(SessionStateService).setLanguage(culture);
  return injector;
}

describe('provideAbpCore', () => {
  it('the four header interceptors are installed by default', () => {
    const injector = createInjector([provideAbpCore(withOptions({ environment }))]);

    expect(injector.get(HTTP_INTERCEPTORS)).toHaveLength(4);
  });

  it('withOptions fills in the defaults', () => {
    const injector = createInjector([provideAbpCore(withOptions({ environment }))]);

    expect(injector.get(ABP_ROOT_OPTIONS)).toMatchObject({
      tenantKey: '__tenant',
      othersGroup: 'AbpUi::OthersGroup',
      sendNullsAsQueryParam: false,
    });
  });

  it('the same feature passed twice is an error', () => {
    expect(() =>
      provideAbpCore(withOptions({ environment }), withOptions({ environment })),
    ).toThrow(DuplicateFeatureError);
  });
});

describe('withLocalizations', () => {
  it('each text goes into the multi token on its own rather than as an array', () => {
    const injector = speaking(
      createInjector([
        provideAbpCore(
          withOptions({ environment }),
          withLocalizations([texts('en', 'Keep'), texts('tr', 'Sakla')]),
        ),
      ]),
      'en',
    );

    expect(injector.get(LOCALIZATIONS)).toHaveLength(2);
    expect(injector.get(LocalizationService).t('AbpUi::Save')).toBe('Keep');
  });

  it('may be passed more than once, one per package', () => {
    const injector = speaking(
      createInjector([
        provideAbpCore(
          withOptions({ environment }),
          withLocalizations([texts('en', 'From the module')]),
          withLocalizations([texts('en', 'From the host')]),
        ),
      ]),
      'en',
    );

    // Later contributions win, which is how a host overrides a module's wording.
    expect(injector.get(LocalizationService).t('AbpUi::Save')).toBe('From the host');
  });
});

describe('the other features', () => {
  it('withRegisterLocale is called when the language changes', async () => {
    const registerLocale = vi.fn(() => Promise.resolve());
    const injector = createInjector([
      provideAbpCore(withOptions({ environment }), withRegisterLocale(registerLocale)),
    ]);

    await injector.get(REGISTER_LOCALE)('tr');

    expect(registerLocale).toHaveBeenCalledWith('tr');
  });

  it('withCompareFunc replaces how the menu is ordered', () => {
    const injector = createInjector([
      provideAbpCore(
        withOptions({ environment }),
        withCompareFunc((a, b) => a.name.localeCompare(b.name)),
      ),
    ]);
    const routes = injector.get(RoutesService);

    routes.add([
      { name: 'Zebra', order: 1 },
      { name: 'Apple', order: 2 },
    ]);

    expect(routes.flat.value.map(route => route.name)).toEqual(['Apple', 'Zebra']);
  });
});
