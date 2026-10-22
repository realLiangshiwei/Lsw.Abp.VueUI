import {
  ABP_INJECTOR_KEY,
  createInjector,
  LocalizationService,
  RoutesService,
  StorageService,
  type Injector,
} from '@lsw-abpvue/core';
import { ErrorPageService, PageAlertService } from '@lsw-abpvue/theme-shared';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
  mounted.push(wrapper);
  await wrapper.vm.$nextTick();

  return wrapper;
}

let injector: Injector;
let router: Router;
const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  injector.destroy();
  document.body.innerHTML = '';
});

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

  it('expands the menu ancestors of the current page', async () => {
    router.addRoute({ path: '/identity/users', component: page });
    injector.get(RoutesService).add([
      { name: '::Menu:Administration', order: 100 },
      { name: '::Menu:Identity', parentName: '::Menu:Administration', order: 1 },
      { path: '/identity/users', name: '::Users', parentName: '::Menu:Identity', order: 1 },
    ]);
    const wrapper = await render(ApplicationLayout, injector, router, '/identity/users');

    expect(wrapper.find('.abp-routes a[href="/identity/users"]').isVisible()).toBe(true);
  });

  it('remembers a collapsed sidebar', async () => {
    const wrapper = await render(ApplicationLayout, injector, router);

    await wrapper.find('nav.navbar button').trigger('click');

    expect(injector.get(StorageService).getItem('abpThemeBasicSidebarCollapsed')).toBe('true');
    expect(wrapper.find('.abp-shell--collapsed').exists()).toBe(true);
  });

  it('names menu and breadcrumb controls from existing application and current-page content', async () => {
    const wrapper = await render(ApplicationLayout, injector, router, '/books/authors');
    const menu = wrapper.get('.abp-shell__menu-toggle');
    expect(menu.attributes('aria-label')).toBe('ABP');
    const sidebarId = menu.attributes('aria-controls');
    expect(wrapper.get(`[id="${sidebarId}"]`).classes()).toContain('abp-shell__sidebar');
    const breadcrumb = wrapper.get('.breadcrumb').element.parentElement;
    const currentId = breadcrumb?.getAttribute('aria-labelledby');
    expect(wrapper.get(`[id="${currentId}"]`).text()).toBe(
      wrapper.get('.breadcrumb [aria-current="page"]').text(),
    );
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
    await render(ApplicationLayout, injector, router);
    await flushPromises();

    const errorPage = document.querySelector('[role="alertdialog"].abp-error-page');
    expect(errorPage?.textContent).toContain('You are not authorized!');
    expect(errorPage?.textContent).toContain('403');
    expect(errorPage?.closest('[aria-hidden="true"], [inert]')).toBeNull();
  });
});

describe('AccountLayout', () => {
  it('is a card with the language switcher above it', async () => {
    const wrapper = await render(AccountLayout, injector, router);

    expect(wrapper.find('.card').text()).toContain('the page');
    expect(wrapper.find('.navbar-brand').exists()).toBe(true);
  });
});
