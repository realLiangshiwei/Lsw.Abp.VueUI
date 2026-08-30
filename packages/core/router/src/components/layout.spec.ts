// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import {
  ABP_INJECTOR_KEY,
  createInjector,
  LayoutType,
  ReplaceableComponentsService,
  RoutesService,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import AbpDynamicLayout from './AbpDynamicLayout.vue';
import AbpReplaceableRouteContainer from './AbpReplaceableRouteContainer.vue';

const ApplicationLayout = defineComponent({
  name: 'ApplicationLayout',
  setup:
    (_props, { slots }) =>
    () =>
      h('div', { class: 'application' }, slots.default?.()),
});

const AccountLayout = defineComponent({
  name: 'AccountLayout',
  setup:
    (_props, { slots }) =>
    () =>
      h('div', { class: 'account' }, slots.default?.()),
});

const ModuleUsers = defineComponent({ name: 'ModuleUsers', render: () => h('p', 'module users') });
const HostUsers = defineComponent({ name: 'HostUsers', render: () => h('p', 'host users') });

async function render(
  component: Parameters<typeof mount>[0],
  routes: RouteRecordRaw[],
  path: string,
  prepare: (injector: Injector) => void = () => {},
  props: Record<string, unknown> = {},
) {
  const injector = createInjector([]);
  prepare(injector);

  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  await router.isReady();

  return mount(component, {
    props,
    slots: { default: '<p>the page</p>' },
    global: { plugins: [router], provide: { [ABP_INJECTOR_KEY]: injector } },
  });
}

const page = { path: '/', component: defineComponent({ name: 'HomePage', render: () => h('p') }) };

describe('AbpDynamicLayout', () => {
  const registerLayouts = (injector: Injector) => {
    const replaceable = injector.get(ReplaceableComponentsService);
    replaceable.add({ key: 'Theme.ApplicationLayoutComponent', component: ApplicationLayout });
    replaceable.add({ key: 'Theme.AccountLayoutComponent', component: AccountLayout });
  };

  it('renders the content as it is until a theme registers layouts', async () => {
    const wrapper = await render(AbpDynamicLayout, [page], '/');

    expect(wrapper.find('.application').exists()).toBe(false);
    expect(wrapper.text()).toBe('the page');
  });

  it('picks the layout the route declares', async () => {
    const wrapper = await render(
      AbpDynamicLayout,
      [{ ...page, meta: { layout: LayoutType.application } }],
      '/',
      registerLayouts,
    );

    expect(wrapper.find('.application').exists()).toBe(true);
    expect(wrapper.text()).toBe('the page');
  });

  it('a child route without one uses the layout of its parent', async () => {
    const wrapper = await render(
      AbpDynamicLayout,
      [
        {
          path: '/account',
          meta: { layout: LayoutType.account },
          component: defineComponent({ name: 'AccountShell', render: () => h('div') }),
          children: [
            {
              path: 'login',
              component: defineComponent({ name: 'LoginPage', render: () => h('p') }),
            },
          ],
        },
      ],
      '/account/login',
      registerLayouts,
    );

    expect(wrapper.find('.account').exists()).toBe(true);
  });

  it('without one on the route the layout is inherited from the section in the menu tree', async () => {
    const wrapper = await render(
      AbpDynamicLayout,
      [{ ...page, path: '/identity/users', component: page.component }],
      '/identity/users',
      injector => {
        registerLayouts(injector);
        injector.get(RoutesService).add([
          { name: 'Identity', path: '/identity', layout: LayoutType.application },
          { name: 'Users', path: '/identity/users', parentName: 'Identity' },
        ]);
      },
    );

    expect(wrapper.find('.application').exists()).toBe(true);
  });

  it('falls back to the layout it was given when nothing says otherwise', async () => {
    const wrapper = await render(AbpDynamicLayout, [page], '/', registerLayouts, {
      defaultLayout: LayoutType.account,
    });

    expect(wrapper.find('.account').exists()).toBe(true);
  });
});

describe('AbpReplaceableRouteContainer', () => {
  const routes: RouteRecordRaw[] = [
    {
      path: '/users',
      component: AbpReplaceableRouteContainer,
      meta: {
        replaceableComponent: { key: 'Identity.UsersComponent', defaultComponent: ModuleUsers },
      },
    },
    { path: '/', component: AbpReplaceableRouteContainer },
  ];

  it('renders what the module ships when nobody replaced it', async () => {
    const wrapper = await render(AbpReplaceableRouteContainer, routes, '/users');

    expect(wrapper.text()).toBe('module users');
  });

  it('renders what the host registered', async () => {
    const wrapper = await render(AbpReplaceableRouteContainer, routes, '/users', injector =>
      injector
        .get(ReplaceableComponentsService)
        .add({ key: 'Identity.UsersComponent', component: HostUsers }),
    );

    expect(wrapper.text()).toBe('host users');
  });

  it('renders nothing when the route declares no replaceable component', async () => {
    const wrapper = await render(AbpReplaceableRouteContainer, routes, '/');

    expect(wrapper.text()).toBe('');
  });
});
