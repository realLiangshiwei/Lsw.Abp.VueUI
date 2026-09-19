import { lazyRoutes } from '@lsw-abpvue/core/router';
import type { RouteRecordRaw } from 'vue-router';
import ComponentsPage from './pages/ComponentsPage.vue';
import FeedbackPage from './pages/FeedbackPage.vue';
import HomePage from './pages/HomePage.vue';
import { userContributors } from './extensions/user-contributors';

/**
 * Menu entries live in `meta.routes`, which is how a page declares its own. A module's
 * come from its `/config` entry instead: the menu has to be there at startup, and the
 * pages arrive on the first navigation into them.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: HomePage,
    meta: { title: 'AbpUi::Welcome', routes: { name: 'AbpUi::Welcome', order: 1 } },
  },
  {
    path: '/theme/components',
    component: ComponentsPage,
    meta: {
      title: 'Components',
      routes: { name: 'Components', order: 2, iconClass: 'bi bi-ui-checks', group: 'Theme' },
    },
  },
  {
    path: '/theme/feedback',
    component: FeedbackPage,
    meta: {
      title: 'Feedback',
      routes: { name: 'Feedback', order: 3, iconClass: 'bi bi-chat-left-text', group: 'Theme' },
    },
  },

  // All five open source modules. The host's contributors are handed to identity here --
  // the one place an application says anything about a module's pages (design 05 §6).
  lazyRoutes('/identity', () =>
    import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userContributors)),
  ),
  lazyRoutes('/account', () =>
    import('@lsw-abpvue/account').then(module => module.createAccountRoutes()),
  ),
  lazyRoutes('/tenant-management', () =>
    import('@lsw-abpvue/tenant-management').then(module => module.createTenantManagementRoutes()),
  ),
  lazyRoutes('/setting-management', () =>
    import('@lsw-abpvue/setting-management').then(module => module.createSettingManagementRoutes()),
  ),
];
