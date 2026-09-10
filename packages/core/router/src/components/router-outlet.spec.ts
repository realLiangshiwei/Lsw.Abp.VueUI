// @vitest-environment happy-dom
import {
  ABP_INJECTOR_KEY,
  createInjector,
  defineToken,
  inject as injectAbp,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { flushPromises, mount } from '@vue/test-utils';
import { withResolvers } from '../guards.js';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import AbpRouterOutlet from './AbpRouterOutlet.vue';

interface Greeting {
  text: string;
}

const GREETING = defineToken<Greeting>('GREETING', { factory: () => ({ text: 'from the root' }) });

const Page = defineComponent({
  name: 'ThePage',
  setup: () => {
    const greeting = injectAbp(GREETING);
    return () => h('p', greeting.text);
  },
});

async function render(routes: RouteRecordRaw[], path: string, injector = createInjector([])) {
  const router = createRouter({ history: createMemoryHistory(), routes });

  // Mounted before navigating, so the guards run the way vue-router runs them in an
  // application: inside `app.runWithContext`, where the injector is reachable.
  const wrapper = mount(defineComponent({ render: () => h(AbpRouterOutlet) }), {
    global: { plugins: [router], provide: { [ABP_INJECTOR_KEY]: injector } },
  });

  await router.push(path);
  await flushPromises();

  return wrapper;
}

const moduleRoute = (providers?: ProviderInput[], children?: RouteRecordRaw[]): RouteRecordRaw => ({
  path: '/identity',
  component: AbpRouterOutlet,
  ...(providers ? { meta: { providers } } : {}),
  children: children ?? [{ path: 'users', component: Page }],
});

describe('AbpRouterOutlet', () => {
  it('a page under the outlet resolves what the route provides', async () => {
    const wrapper = await render(
      [moduleRoute([{ provide: GREETING, useValue: { text: 'from the module' } }])],
      '/identity/users',
    );

    expect(wrapper.text()).toBe('from the module');
  });

  it('what the route does not provide still comes from above it', async () => {
    const wrapper = await render([moduleRoute([])], '/identity/users');

    expect(wrapper.text()).toBe('from the root');
  });

  it('a route with no providers at all is just an outlet', async () => {
    const wrapper = await render([moduleRoute()], '/identity/users');

    expect(wrapper.text()).toBe('from the root');
  });

  it('an outlet nested in another does not build the outer providers a second time', async () => {
    let built = 0;
    const providers: ProviderInput[] = [
      { provide: GREETING, useFactory: () => ({ text: `built ${++built}` }) },
    ];

    const wrapper = await render(
      [
        moduleRoute(providers, [
          { path: 'users', component: AbpRouterOutlet, children: [{ path: '', component: Page }] },
        ]),
      ],
      '/identity/users',
    );

    expect(wrapper.text()).toBe('built 1');
    expect(built).toBe(1);
  });
});

describe('the resolvers and the pages', () => {
  it('see the same route injector, which is what a module assembles through', async () => {
    const seen: string[] = [];
    const providers: ProviderInput[] = [
      { provide: GREETING, useFactory: () => ({ text: 'from the module' }) },
    ];

    const wrapper = await render(
      [
        {
          path: '/identity',
          component: AbpRouterOutlet,
          // What `withResolvers` sees has to be what the page sees; a resolver reading
          // the application's injector instead would find none of the module's options.
          beforeEnter: [
            withResolvers([
              () => {
                seen.push(injectAbp(GREETING).text);
              },
            ]),
          ],
          meta: { providers },
          children: [{ path: 'users', component: Page }],
        },
      ],
      '/identity/users',
    );

    expect(seen).toEqual(['from the module']);
    expect(wrapper.text()).toBe('from the module');
  });

  it('one instance of it, not one each', async () => {
    let built = 0;
    const providers: ProviderInput[] = [
      { provide: GREETING, useFactory: () => ({ text: `built ${++built}` }) },
    ];

    const wrapper = await render(
      [
        {
          path: '/identity',
          component: AbpRouterOutlet,
          beforeEnter: [withResolvers([() => injectAbp(GREETING)])],
          meta: { providers },
          children: [{ path: 'users', component: Page }],
        },
      ],
      '/identity/users',
    );

    expect(wrapper.text()).toBe('built 1');
    expect(built).toBe(1);
  });
});
