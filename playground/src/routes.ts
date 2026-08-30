import type { RouteRecordRaw } from 'vue-router';
import HomePage from './pages/HomePage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';

/**
 * Menu entries live in `meta.routes`, which is how an ABP module ships its menu: the
 * routes handler collects them at startup and `RoutesService` filters them by permission.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: HomePage,
    meta: { title: 'AbpUi::Welcome', routes: { name: 'AbpUi::Welcome', order: 1 } },
  },
  {
    path: '/identity',
    component: PlaceholderPage,
    meta: {
      routes: {
        name: 'AbpIdentity::Menu:IdentityManagement',
        order: 2,
        group: 'AbpUi::Administration',
      },
    },
  },
  {
    path: '/identity/users',
    component: PlaceholderPage,
    meta: {
      title: 'AbpIdentity::Users',
      requiredPolicy: 'AbpIdentity.Users',
      routes: {
        name: 'AbpIdentity::Users',
        parentName: 'AbpIdentity::Menu:IdentityManagement',
        requiredPolicy: 'AbpIdentity.Users',
        order: 1,
      },
    },
  },
  {
    path: '/tenants',
    component: PlaceholderPage,
    meta: {
      title: 'AbpTenantManagement::Tenants',
      requiredPolicy: 'AbpTenantManagement.Tenants',
      routes: {
        name: 'AbpTenantManagement::Tenants',
        requiredPolicy: 'AbpTenantManagement.Tenants',
        order: 3,
        group: 'AbpUi::Administration',
      },
    },
  },
  {
    path: '/settings',
    component: PlaceholderPage,
    meta: {
      title: 'AbpSettingManagement::Settings',
      routes: { name: 'AbpSettingManagement::Settings', order: 4, group: 'AbpUi::Administration' },
    },
  },
];
