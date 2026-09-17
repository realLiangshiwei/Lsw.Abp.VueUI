import {
  ABP_INJECTOR_KEY,
  createInjector,
  LocalizationService,
  RoutesService,
  StorageService,
  type Injector,
} from '@lsw-abpvue/core';
import { ErrorPageService, PageAlertService } from '@lsw-abpvue/theme-shared';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { provideAbpThemeBasic } from '../providers/theme-basic.provider.js';
import AccountLayout from './AccountLayout.vue';
import ApplicationLayout from './ApplicationLayout.vue';

const page = { template: '<p>the page</p>' };

async function render(layout: Component, injector: Injector, router: Router, path = '/books') {
  await router.push(path);
  await router.isReady();

  const wrapper = mount(layout, {
    slots: { default: '<p>the page</p>' },
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string, ...params: unknown[]) =>
          injector.get(LocalizationService).t(key, ...params),
      },
    },
  });
  await wrapper.vm.$nextTick();

  return wrapper;
}

let injector: Injector;
let router: Router;

beforeEach(() => {
  injector = createInjector([provideAbpThemeBasic()]);
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/books', component: page },
      { path: '/books/authors', component: page },
    ],
  });

  injector.get(RoutesService).add([
    { path: '/books', name: '::Menu:Books', iconClass: 'bi bi-book', order: 1 },
    { path: '/books/authors', name: '::Menu:Authors', parentName: '::Menu:Books', order: 2 },
  ]);
});

describe('ApplicationLayout', () => {
  it('renders the page it is wrapped around', async () => {
    const wrapper = await render(ApplicationLayout, injector, router);

    expect(wrapper.text()).toContain('the page');
  });

  it('builds the sidebar from the routes service', async () => {
    const wrapper = await render(ApplicationLayout, injector, router);

    expect(wrapper.find('.abp-routes').text()).toContain('Books');
  });

  it('opens a branch three levels deep, which is how ABP files its own pages', async () => {
    // Administration -> Identity management -> Users. The middle one has no page of its
    // own, so a menu that only renders two levels loses the whole branch.
    injector.get(RoutesService).add([
      { name: '::Menu:Administration', order: 100 },
      { name: '::Menu:Identity', parentName: '::Menu:Administration', order: 1 },
      { path: '/identity/users', name: '::Users', parentName: '::Menu:Identity', order: 1 },
    ]);

    const wrapper = await render(ApplicationLayout, injector, router);
    const menu = wrapper.find('.abp-routes');
    const expander = (label: string) =>
      menu.findAll('button').find(button => button.text().includes(label));

    await expander('Administration')?.trigger('click');
    await expander('Identity')?.trigger('click');

    expect(menu.find('a[href="/identity/users"]').exists()).toBe(true);
  });

  it('leaves out what the current user has no policy for', async () => {
    injector
      .get(RoutesService)
      .add([{ path: '/secrets', name: '::Menu:Secrets', requiredPolicy: 'Secrets.View' }]);
    const wrapper = await render(ApplicationLayout, injector, router);

    expect(wrapper.find('.abp-routes').text()).not.toContain('Secrets');
  });

  it('remembers a collapsed sidebar', async () => {
    const wrapper = await render(ApplicationLayout, injector, router);

    await wrapper.find('nav.navbar button').trigger('click');

    expect(injector.get(StorageService).getItem('abpThemeBasicSidebarCollapsed')).toBe('true');
    expect(wrapper.find('.abp-shell--collapsed').exists()).toBe(true);
  });

  it('shows the trail to the page in a breadcrumb', async () => {
    const wrapper = await render(ApplicationLayout, injector, router, '/books/authors');

    const breadcrumb = wrapper.find('.breadcrumb');
    expect(breadcrumb.text()).toContain('Books');
    expect(breadcrumb.find('[aria-current="page"]').text()).toContain('Authors');
  });

  it('shows a page alert where the page can see it', async () => {
    injector.get(PageAlertService).show({ message: 'Your licence expires soon.' });
    const wrapper = await render(ApplicationLayout, injector, router);

    expect(wrapper.find('[role="alert"]').text()).toContain('Your licence expires soon.');
  });

  it('covers the page when a request ends it', async () => {
    injector.get(ErrorPageService).show({ status: 403, title: 'You are not authorized!' });
    const wrapper = await render(ApplicationLayout, injector, router);

    const errorPage = wrapper.find('.abp-error-page');
    expect(errorPage.text()).toContain('You are not authorized!');
    expect(errorPage.text()).toContain('403');
  });
});

describe('AccountLayout', () => {
  it('is a card with the language switcher above it', async () => {
    const wrapper = await render(AccountLayout, injector, router);

    expect(wrapper.find('.card').text()).toContain('the page');
    expect(wrapper.find('.navbar-brand').exists()).toBe(true);
  });
});
