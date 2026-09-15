import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import { IdentityPolicyNames, IdentityRouteNames } from '@lsw-abpvue/identity/config';
import type { RouteRecordRaw } from 'vue-router';
import RolesPage from './components/RolesPage.vue';
import UsersPage from './components/UsersPage.vue';
import { IdentityComponents } from './enums/components.js';
import type { IdentityConfigOptions } from './models/config-options.js';
import { provideIdentity } from './providers/identity.provider.js';
import { identityExtensionsResolver } from './resolvers/extensions.resolver.js';

/**
 * The routes of the identity module. `AbpRouterOutlet` establishes the route-level
 * injector from `meta.providers`, and the resolver assembles the extension points before
 * either page renders -- Angular's route `providers` and `resolve`, in the shapes
 * vue-router has for them.
 *
 * Meant to be lazy loaded: `lazyRoutes('/identity', () => import('@lsw-abpvue/identity')
 * .then(m => m.createIdentityRoutes(options)))` keeps the pages out of the first load,
 * while `@lsw-abpvue/identity/config` puts the menu entries up at startup.
 *
 * @param options What the host contributes to the two pages
 */
export function createIdentityRoutes(options: IdentityConfigOptions = {}): RouteRecordRaw[] {
  return [
    {
      path: '/identity',
      component: AbpRouterOutlet,
      beforeEnter: [withResolvers([identityExtensionsResolver])],
      meta: { providers: provideIdentity(options), requiresAuthentication: true },
      children: [
        { path: '', redirect: '/identity/roles' },
        {
          path: 'roles',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: IdentityRouteNames.Roles,
            requiredPolicy: IdentityPolicyNames.Roles,
            replaceableComponent: {
              key: IdentityComponents.Roles,
              defaultComponent: RolesPage,
            },
          },
        },
        {
          path: 'users',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: IdentityRouteNames.Users,
            requiredPolicy: IdentityPolicyNames.Users,
            replaceableComponent: {
              key: IdentityComponents.Users,
              defaultComponent: UsersPage,
            },
          },
        },
      ],
    },
  ];
}
