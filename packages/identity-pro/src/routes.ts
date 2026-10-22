import { AbpReplaceableRouteContainer, withResolvers } from '@lsw-abpvue/core/router';
import { createIdentityRoutes } from '@lsw-abpvue/identity';
import type { RouteRecordRaw } from 'vue-router';
import UsersPage from './components/UsersPage.vue';
import RolesPage from './components/RolesPage.vue';
import ClaimsPage from './components/ClaimsPage.vue';
import OrganizationUnitsPage from './components/OrganizationUnitsPage.vue';
import SecurityLogsPage from './components/SecurityLogsPage.vue';
import { IdentityProComponents } from './enums/components.js';
import { IdentityProPolicyNames, IdentityProRouteNames } from '@lsw-abpvue/identity-pro/config';
import type { IdentityProConfigOptions } from './models/config-options.js';
import { provideIdentityPro } from './providers/identity-pro.provider.js';
import { identityProExtensionsResolver } from './resolvers/extensions.resolver.js';

/** Creates commercial identity routes with typed application contributions. */
export function createIdentityProRoutes(options: IdentityProConfigOptions = {}): RouteRecordRaw[] {
  const routes = createIdentityRoutes();

  for (const route of routes) {
    route.beforeEnter = [withResolvers([identityProExtensionsResolver])];
    route.meta = { ...route.meta, providers: provideIdentityPro(options) };
    for (const child of route.children ?? []) {
      if (child.meta?.replaceableComponent?.key === IdentityProComponents.Roles) {
        child.meta.replaceableComponent = {
          ...child.meta.replaceableComponent,
          defaultComponent: RolesPage,
        };
      }
      if (child.meta?.replaceableComponent?.key === IdentityProComponents.Users) {
        child.meta.replaceableComponent = {
          ...child.meta.replaceableComponent,
          defaultComponent: UsersPage,
        };
      }
    }
    route.children?.push({
      path: 'claim-types',
      component: AbpReplaceableRouteContainer,
      meta: {
        title: IdentityProRouteNames.ClaimTypes,
        requiredPolicy: IdentityProPolicyNames.ClaimTypes,
        replaceableComponent: { key: IdentityProComponents.Claims, defaultComponent: ClaimsPage },
      },
    });
    route.children?.push(
      {
        path: 'organization-units',
        component: AbpReplaceableRouteContainer,
        meta: {
          title: IdentityProRouteNames.OrganizationUnits,
          requiredPolicy: IdentityProPolicyNames.OrganizationUnits,
          replaceableComponent: {
            key: IdentityProComponents.OrganizationUnits,
            defaultComponent: OrganizationUnitsPage,
          },
        },
      },
      {
        path: 'security-logs',
        component: AbpReplaceableRouteContainer,
        meta: {
          title: IdentityProRouteNames.SecurityLogs,
          requiredPolicy: IdentityProPolicyNames.SecurityLogs,
          replaceableComponent: {
            key: IdentityProComponents.SecurityLogs,
            defaultComponent: SecurityLogsPage,
          },
        },
      },
    );
  }

  return routes;
}
