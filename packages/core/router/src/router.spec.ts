// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import {
  AuthService,
  createAbpApp,
  DocumentService,
  provideAbpCore,
  RoutesService,
  withOptions,
  type AbpApp,
  type Environment,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { HTTP_FETCH, type FetchLike } from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h } from 'vue';
import { createMemoryHistory, RouterView, type RouteRecordRaw } from 'vue-router';
import { lazyRoutes } from './lazy-routes';
import { provideAbpRouter, withRouterHistory } from './provider';
import { ABP_ROUTER } from './tokens';

const environment: Environment = {
  apis: { default: { url: 'https://backend' } },
  application: { name: 'BookStore' },
  production: false,
};

const Page = (text: string) =>
  defineComponent({ name: `Page${text}`, render: () => h('main', text) });

/** `core` may not touch `document` (SSR rule), so borrow an element from test-utils. */
const hostElement = () =>
  mount(defineComponent({ name: 'HostElement', render: () => h('div') })).element;

const Root = defineComponent({ name: 'AppRoot', render: () => h(RouterView) });

async function start(
  routes: RouteRecordRaw[],
  options: { policies?: Record<string, boolean>; providers?: ProviderInput[]; path?: string } = {},
): Promise<AbpApp> {
  const configuration = {
    localization: {
      values: {},
      resources: {},
      languages: [],
      currentCulture: { cultureName: 'en', isRightToLeft: false, dateTimeFormat: {} },
      languagesMap: {},
      languageFilesMap: {},
      useRouteBasedCulture: false,
    },
    auth: { grantedPolicies: options.policies ?? {} },
    setting: { values: {} },
    currentUser: {
      isAuthenticated: false,
      emailVerified: false,
      phoneNumberVerified: false,
      roles: [],
    },
    features: { values: {} },
    globalFeatures: { enabledFeatures: [] },
    multiTenancy: { isEnabled: false },
    currentTenant: { isAvailable: false },
    timing: { timeZone: { iana: {}, windows: {} } },
    clock: {},
    objectExtensions: { modules: {}, enums: {} },
    extraProperties: {},
  };

  const send: FetchLike = url =>
    Promise.resolve(
      new Response(
        JSON.stringify(
          String(url).includes('application-localization')
            ? { resources: {}, currentCulture: configuration.localization.currentCulture }
            : configuration,
        ),
      ),
    );
  const history = createMemoryHistory();
  if (options.path) history.replace(options.path);

  const app = await createAbpApp(Root, {
    providers: [
      provideAbpCore(withOptions({ environment })),
      provideAbpRouter(routes, withRouterHistory(history)),
      { provide: HTTP_FETCH, useValue: send },
      ...(options.providers ?? []),
    ],
  });
  app.mount(hostElement());

  return app;
}

describe('provideAbpRouter', () => {
  it('the router is installed and navigation works as usual', async () => {
    const app = await start([
      { path: '/', name: 'home', component: Page('home') },
      { path: '/books', name: 'books', component: Page('books') },
    ]);

    await app.injector.get(ABP_ROUTER).push('/books');

    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('books');
  });

  it('the menu items a route declares reach RoutesService', async () => {
    const app = await start([
      {
        path: '/identity/users',
        component: Page('users'),
        meta: { routes: { name: 'Identity.Users', parentName: 'Identity' } },
      },
      { path: '/identity', component: Page('identity'), meta: { routes: { name: 'Identity' } } },
    ]);

    const tree = app.injector.get(RoutesService).tree.value;

    expect(tree.map(node => node.name)).toEqual(['Identity']);
    expect(tree[0]?.children[0]).toMatchObject({ name: 'Identity.Users', path: '/identity/users' });
  });

  it('the document title follows the route', async () => {
    // Through the platform service rather than `document`: that is the rule core lives by,
    // and it makes the assertion independent of the DOM.
    const titles: string[] = [];
    const app = await start(
      [
        { path: '/', component: Page('home') },
        { path: '/books', component: Page('books'), meta: { title: 'Books' } },
      ],
      {
        providers: [
          {
            provide: DocumentService,
            useValue: {
              nativeDocument: undefined,
              setTitle: (title: string) => void titles.push(title),
              setDir: () => {},
              getBaseUrl: () => '/',
            },
          },
        ],
      },
    );

    await app.injector.get(ABP_ROUTER).push('/books');

    expect(titles.at(-1)).toBe('Books | BookStore');
  });

  it('a navigation the guard refused does not change the title -- what is on screen is still the old page', async () => {
    const titles: string[] = [];
    const app = await start(
      [
        { path: '/', component: Page('home'), meta: { title: 'Home' } },
        { path: '/books', component: Page('books'), meta: { title: 'Books' } },
      ],
      {
        providers: [
          {
            provide: DocumentService,
            useValue: {
              nativeDocument: undefined,
              setTitle: (title: string) => void titles.push(title),
              setDir: () => {},
              getBaseUrl: () => '/',
            },
          },
        ],
      },
    );
    const router = app.injector.get(ABP_ROUTER);
    router.beforeEach(to => to.path !== '/books');

    await router.push('/books');

    expect(titles.at(-1)).toBe('Home | BookStore');
  });
});

describe('the permission guard', () => {
  const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: Page('home') },
    {
      path: '/users',
      name: 'users',
      component: Page('users'),
      meta: { requiredPolicy: 'AbpIdentity.Users' },
    },
  ];

  it('a route without the policy cannot be entered', async () => {
    const app = await start(routes);

    await app.injector
      .get(ABP_ROUTER)
      .push('/users')
      .catch(() => undefined);

    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('home');
  });

  it('a granted route can be entered', async () => {
    const app = await start(routes, { policies: { 'AbpIdentity.Users': true } });

    await app.injector.get(ABP_ROUTER).push('/users');

    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('users');
  });

  it('a policy on a parent covers its children', async () => {
    const app = await start([
      { path: '/', name: 'home', component: Page('home') },
      {
        path: '/identity',
        component: Page('identity'),
        meta: { requiredPolicy: 'AbpIdentity' },
        children: [{ path: 'users', name: 'users', component: Page('users') }],
      },
    ]);

    await app.injector
      .get(ABP_ROUTER)
      .push('/identity/users')
      .catch(() => undefined);

    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('home');
  });
});

describe('the authentication guard', () => {
  const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: Page('home') },
    {
      path: '/account',
      name: 'account',
      component: Page('account'),
      meta: { requiresAuthentication: true },
    },
  ];

  it('an anonymous visit to a route that needs a session goes to the authentication service', async () => {
    const navigateToLogin = vi.fn(() => Promise.resolve());
    const app = await start(routes, {
      providers: [
        {
          provide: AuthService,
          useValue: {
            init: () => Promise.resolve(),
            isAuthenticated: computed(() => false),
            navigateToLogin,
            logout: () => Promise.resolve(),
            getAccessToken: () => null,
            refreshToken: () => Promise.resolve(),
          },
        },
      ],
    });

    await app.injector
      .get(ABP_ROUTER)
      .push('/account')
      .catch(() => undefined);

    expect(navigateToLogin).toHaveBeenCalledWith('/account');
    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('home');
  });

  it('lets the host decide when there is no authentication package', async () => {
    const app = await start(routes);

    await app.injector.get(ABP_ROUTER).push('/account');

    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('account');
  });
});

describe('lazyRoutes', () => {
  const identityRoutes: RouteRecordRaw[] = [
    { path: '/identity', name: 'identity', component: Page('identity') },
    { path: '/identity/users', name: 'users', component: Page('users') },
  ];

  it('loads on first entry and resolves to the real route once loaded', async () => {
    const load = vi.fn(() => Promise.resolve(identityRoutes));
    const app = await start([
      { path: '/', name: 'home', component: Page('home') },
      lazyRoutes('/identity', load),
    ]);
    expect(load).not.toHaveBeenCalled();

    await app.injector.get(ABP_ROUTER).push('/identity/users');

    expect(load).toHaveBeenCalledOnce();
    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('users');
  });

  it('a reload deep in the URL still lands on the real route', async () => {
    const app = await start(
      [
        { path: '/', name: 'home', component: Page('home') },
        lazyRoutes('/identity', () => Promise.resolve(identityRoutes)),
      ],
      { path: '/identity/users' },
    );

    expect(app.injector.get(ABP_ROUTER).currentRoute.value.name).toBe('users');
  });

  it('the placeholder route is gone once the module has loaded', async () => {
    const load = vi.fn(() => Promise.resolve(identityRoutes));
    const app = await start([
      { path: '/', name: 'home', component: Page('home') },
      lazyRoutes('/identity', load),
    ]);
    const router = app.injector.get(ABP_ROUTER);

    await router.push('/identity/users');
    await router.push('/');
    await router.push('/identity');

    expect(load).toHaveBeenCalledOnce();
    expect(router.hasRoute('abp-lazy:/identity')).toBe(false);
  });
});
