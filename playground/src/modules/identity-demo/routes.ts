import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import type { RouteRecordRaw } from 'vue-router';
import { IdentityComponents } from './enums.js';
import { identityExtensionsResolver } from './extensions.resolver.js';
import UsersPage from './pages/UsersPage.vue';
import {
  provideIdentityDemo,
  type IdentityDemoOptions,
} from './providers/identity-demo.provider.js';

/**
 * The route tree a module ships. `AbpRouterOutlet` establishes the route-level injector
 * from `meta.providers`, and the resolver assembles the extension points before the page
 * renders -- Angular's `providers` and `resolve`, in the shapes vue-router has for them.
 */
export function createIdentityDemoRoutes(options: IdentityDemoOptions = {}): RouteRecordRaw[] {
  return [
    {
      path: '/extensions',
      component: AbpRouterOutlet,
      beforeEnter: [withResolvers([identityExtensionsResolver])],
      meta: { providers: provideIdentityDemo(options) },
      children: [
        {
          path: '',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: 'AbpIdentity::Users',
            replaceableComponent: {
              key: IdentityComponents.Users,
              defaultComponent: UsersPage,
            },
            routes: { name: 'Extensions', order: 4, iconClass: 'bi bi-puzzle' },
          },
        },
      ],
    },
  ];
}
