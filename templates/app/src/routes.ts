import type { RouteRecordRaw } from 'vue-router';
import HomePage from './pages/HomePage.vue';

/**
 * The application's own routes. A menu entry lives in `meta.routes`, which is how a page
 * declares one; a module's comes from its `/config` entry instead, because the menu has
 * to be there at startup while the pages arrive on the first navigation into them.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: HomePage,
    meta: { title: 'AbpUi::Welcome', routes: { name: 'AbpUi::Welcome', order: 1 } },
  },
  // abpv:begin sample-crud
  {
    path: '/books',
    component: () => import('./pages/BooksPage.vue'),
    meta: {
      title: '__APP_NAME__::Menu:Books',
      requiredPolicy: '__APP_NAME__.Books',
      routes: { name: '__APP_NAME__::Menu:Books', order: 2, iconClass: 'bi bi-book' },
    },
  },
  // abpv:end sample-crud

  // abpv:begin identity
  lazyRoutes('/identity', () =>
    import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes()),
  ),
  // abpv:end identity
  // abpv:begin account
  lazyRoutes('/account', () =>
    import('@lsw-abpvue/account').then(module => module.createAccountRoutes()),
  ),
  // abpv:end account
  // abpv:begin tenant-management
  lazyRoutes('/tenant-management', () =>
    import('@lsw-abpvue/tenant-management').then(module => module.createTenantManagementRoutes()),
  ),
  // abpv:end tenant-management
  // abpv:begin setting-management
  lazyRoutes('/setting-management', () =>
    import('@lsw-abpvue/setting-management').then(module => module.createSettingManagementRoutes()),
  ),
  // abpv:end setting-management
];
