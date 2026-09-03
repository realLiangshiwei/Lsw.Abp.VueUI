import { describe, expect, it, vi } from 'vitest';
import configurationFixture from '../../../../e2e/fixtures/application-configuration.json';
import { APP_INITIALIZERS } from '../di/app-initializer.js';
import { runInInjectionContext } from '../di/inject.js';
import { createInjector } from '../di/injector.js';
import type { Environment } from '../models/environment.js';
import type { ApplicationConfigurationDto } from '../proxy/models.js';
import { ConfigStateService } from '../services/config-state.service.js';
import { WindowService } from '../services/platform/window.service.js';
import { SessionStateService } from '../services/session-state.service.js';
import { AuthService, CHECK_AUTHENTICATION_STATE_FN } from '../tokens/auth.token.js';
import { HTTP_FETCH, type FetchLike } from '../tokens/http.token.js';
import { provideAbpCore, withOptions } from './core.provider.js';
import { getInitialData } from './initial-data.js';

const fixture = configurationFixture as unknown as ApplicationConfigurationDto;

const environment: Environment = {
  apis: { default: { url: 'https://localhost:44384' } },
  application: { name: 'BookStore', baseUrl: 'https://{0}.abp.io/' },
  production: false,
};

interface Exchange {
  url: string;
  headers: Record<string, string>;
}

function startup(href = 'https://abp.io/', configuration: ApplicationConfigurationDto = fixture) {
  const exchanges: Exchange[] = [];

  const send: FetchLike = (url, init) => {
    exchanges.push({ url: String(url), headers: (init?.headers ?? {}) as Record<string, string> });

    if (String(url).includes('multi-tenancy/tenants/by-name')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({ success: true, tenantId: 'id-of-acme', name: 'acme', isActive: true }),
        ),
      );
    }
    if (String(url).includes('application-localization')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            resources: { BookStore: { texts: { Menu: 'Menu' }, baseResources: [] } },
            currentCulture: fixture.localization.currentCulture,
          }),
        ),
      );
    }

    return Promise.resolve(new Response(JSON.stringify(configuration)));
  };

  const injector = createInjector([
    provideAbpCore(withOptions({ environment })),
    { provide: HTTP_FETCH, useValue: send },
    {
      provide: WindowService,
      useValue: { nativeWindow: { location: { href } } as unknown as Window, open: () => {} },
    },
  ]);

  return { injector, exchanges };
}

describe('the startup sequence', () => {
  it('provideAbpCore registers it as a startup initializer', () => {
    const { injector } = startup();

    expect(injector.get(APP_INITIALIZERS)).toContain(getInitialData);
  });

  it('resolves the tenant before the configuration, which then carries it', async () => {
    const { injector, exchanges } = startup('https://acme.abp.io/books');

    await runInInjectionContext(injector, getInitialData);

    expect(exchanges.map(exchange => exchange.url.split('?')[0])).toEqual([
      'https://localhost:44384/api/abp/multi-tenancy/tenants/by-name/acme',
      'https://localhost:44384/api/abp/application-configuration',
      'https://localhost:44384/api/abp/application-localization',
    ]);
    expect(exchanges[1]?.headers).toMatchObject({ __tenant: 'id-of-acme' });
  });

  it('the tenant and the language reach the session once the configuration is back', async () => {
    const { injector } = startup();

    await runInInjectionContext(injector, getInitialData);

    expect(injector.get(SessionStateService).getLanguage()).toBe('en');
    expect(injector.get(SessionStateService).getTenant()).toBeNull();
  });

  it('records the tenant the backend says is current', async () => {
    const { injector } = startup('https://abp.io/', {
      ...fixture,
      currentTenant: { id: 'id-of-acme', name: 'acme', isAvailable: true },
    });

    await runInInjectionContext(injector, getInitialData);

    expect(injector.get(SessionStateService).getTenant()?.name).toBe('acme');
  });

  it('the separate request for the texts is made as well', async () => {
    const { injector } = startup();

    await runInInjectionContext(injector, getInitialData);

    expect(injector.get(ConfigStateService).snapshot().localization.values.BookStore).toEqual({
      Menu: 'Menu',
    });
  });

  it('the authentication package starts before the configuration request, so the token is on the first one', async () => {
    const order: string[] = [];
    const { injector: base } = startup();
    const send = base.get(HTTP_FETCH);
    const record: FetchLike = (url, init) => {
      order.push(String(url).split('/api/abp/')[1]?.split('?')[0] ?? String(url));
      return send(url, init);
    };
    const injector = createInjector([
      provideAbpCore(withOptions({ environment })),
      { provide: HTTP_FETCH, useValue: record },
      { provide: WindowService, useValue: base.get(WindowService) },
      {
        provide: AuthService,
        useValue: {
          init: () => {
            order.push('auth.init');
            return Promise.resolve();
          },
        } as unknown as AuthService,
      },
    ]);

    await runInInjectionContext(injector, getInitialData);

    expect(order).toEqual(['auth.init', 'application-configuration', 'application-localization']);
  });

  it('skipInitAuthService leaves the authentication package alone', async () => {
    const init = vi.fn(() => Promise.resolve());
    const injector = createInjector([
      provideAbpCore(
        withOptions({ environment, skipInitAuthService: true, skipGetAppConfiguration: true }),
      ),
      { provide: HTTP_FETCH, useValue: () => Promise.resolve(new Response('{}')) },
      { provide: WindowService, useValue: { nativeWindow: undefined, open: () => {} } },
      { provide: AuthService, useValue: { init } as unknown as AuthService },
    ]);

    await runInInjectionContext(injector, getInitialData);

    expect(init).not.toHaveBeenCalled();
  });

  it('the authentication state is checked once the configuration is back, which is where a disowned token shows', async () => {
    const checked = vi.fn();
    const { injector: base } = startup();
    const injector = createInjector([
      { provide: HTTP_FETCH, useValue: base.get(HTTP_FETCH) },
      { provide: WindowService, useValue: base.get(WindowService) },
      provideAbpCore(withOptions({ environment })),
      { provide: CHECK_AUTHENTICATION_STATE_FN, useValue: checked },
    ]);

    await runInInjectionContext(injector, getInitialData);

    expect(checked).toHaveBeenCalledOnce();
  });

  it('stops after the tenant when the host fetches the configuration itself', async () => {
    const exchanges: string[] = [];
    const send = vi.fn<FetchLike>(url => {
      exchanges.push(String(url));
      return Promise.resolve(new Response('{}'));
    });
    const injector = createInjector([
      provideAbpCore(withOptions({ environment, skipGetAppConfiguration: true })),
      { provide: HTTP_FETCH, useValue: send },
      {
        provide: WindowService,
        useValue: {
          nativeWindow: { location: { href: 'https://abp.io/' } } as unknown as Window,
          open: () => {},
        },
      },
    ]);

    await runInInjectionContext(injector, getInitialData);

    expect(exchanges).toEqual([]);
  });
});
