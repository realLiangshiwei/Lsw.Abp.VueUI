import { lazyRoutes } from '@lsw-abpvue/core/router';
import type { RouteRecordRaw } from 'vue-router';
import ComponentsPage from './pages/ComponentsPage.vue';
import FeedbackPage from './pages/FeedbackPage.vue';
import HomePage from './pages/HomePage.vue';
import { proUserContributors, userContributors } from './extensions/user-contributors';

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
    import.meta.env.VITE_ABP_EDITION === 'pro'
      ? import('@lsw-abpvue/identity-pro').then(module =>
          module.createIdentityProRoutes(proUserContributors),
        )
      : import('@lsw-abpvue/identity').then(module =>
          module.createIdentityRoutes(userContributors),
        ),
  ),
  lazyRoutes('/account', () =>
    import.meta.env.VITE_ABP_EDITION === 'pro'
      ? import('@lsw-abpvue/account-pro').then(pro => pro.createAccountProRoutes())
      : import('@lsw-abpvue/account').then(module => module.createAccountRoutes()),
  ),
  import.meta.env.VITE_ABP_EDITION === 'pro'
    ? lazyRoutes('/saas', () =>
        import('@lsw-abpvue/saas').then(module => module.createSaasRoutes()),
      )
    : lazyRoutes('/tenant-management', () =>
        import('@lsw-abpvue/tenant-management').then(module =>
          module.createTenantManagementRoutes(),
        ),
      ),
  lazyRoutes('/setting-management', () =>
    import('@lsw-abpvue/setting-management').then(module => module.createSettingManagementRoutes()),
  ),
  ...(import.meta.env.VITE_ABP_EDITION === 'pro'
    ? [
        lazyRoutes('/gdpr', () =>
          import('@lsw-abpvue/gdpr').then(module => module.createGdprRoutes()),
        ),
        lazyRoutes('/openiddict', () =>
          import('@lsw-abpvue/openiddict-pro').then(module => module.createOpenIddictProRoutes()),
        ),
        lazyRoutes('/audit-logs', () =>
          import('@lsw-abpvue/audit-logging').then(module => module.createAuditLoggingRoutes()),
        ),
        lazyRoutes('/language-management', () =>
          import('@lsw-abpvue/language-management').then(module =>
            module.createLanguageManagementRoutes(),
          ),
        ),
        lazyRoutes('/text-template-management', () =>
          import('@lsw-abpvue/text-template-management').then(module =>
            module.createTextTemplateManagementRoutes(),
          ),
        ),
      ]
    : []),

  // abpv:begin route:books
  {
    path: '/books',
    component: () => import('./pages/BooksPage.vue'),
    meta: {
      title: 'BookStore::Menu:Books',
      requiredPolicy: 'BookStore.Books',
      routes: { name: 'BookStore::Menu:Books', order: 4 },
    },
  },
  // abpv:end route:books
];
