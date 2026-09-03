// @vitest-environment happy-dom
import { createInjector, WindowService } from '@lsw-abpvue/core';
import { ABP_ROUTER } from '@lsw-abpvue/core/router';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { AuthNavigationService } from './auth-navigation.service.js';

const page = { template: '<p>page</p>' };

function navigation(withRouter: boolean) {
  const visited: string[] = [];
  let built = 0;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/account/login', component: page },
    ],
  });

  const injector = createInjector([
    ...(withRouter
      ? [
          {
            provide: ABP_ROUTER,
            useFactory: () => {
              built += 1;
              return router;
            },
          },
        ]
      : []),
    {
      provide: WindowService,
      useValue: {
        nativeWindow: {
          location: { href: 'https://app.abp.io/books', assign: (to: string) => visited.push(to) },
          history: window.history,
        } as unknown as Window,
        open: () => {},
      },
    },
  ]);

  return { router, visited, built: () => built, service: injector.get(AuthNavigationService) };
}

describe('navigation on behalf of authentication', () => {
  it('goes through the router when there is one, without reloading the page', async () => {
    const { router, visited, service } = navigation(true);

    await service.go('/account/login');

    expect(router.currentRoute.value.path).toBe('/account/login');
    expect(visited).toEqual([]);
  });

  it('falls back to a browser navigation with no router, which beats going nowhere', async () => {
    const { visited, service } = navigation(false);

    await service.go('/account/login');

    expect(visited).toEqual(['/account/login']);
  });

  it('rewriting the address bar starts no navigation', () => {
    const { service } = navigation(false);

    service.replaceUrl('/books?page=2');

    expect(window.location.pathname + window.location.search).toBe('/books?page=2');
  });

  it('does not build the router until something is really navigated -- building it makes vue-router read a callback URL that is not cleaned yet', async () => {
    const { built, service } = navigation(true);

    expect(built()).toBe(0);

    await service.go('/account/login');

    expect(built()).toBe(1);
  });

  it('reads the current URL', () => {
    expect(navigation(false).service.currentUrl()).toBe('https://app.abp.io/books');
  });
});
