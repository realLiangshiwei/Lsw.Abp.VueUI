import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import {
  TenantManagementPolicyNames,
  TenantManagementRouteNames,
} from '@lsw-abpvue/tenant-management/config';
import type { RouteRecordRaw } from 'vue-router';
import TenantsPage from './components/TenantsPage.vue';
import { TenantManagementComponents } from './enums/components.js';
import type { TenantManagementConfigOptions } from './models/config-options.js';
import { provideTenantManagement } from './providers/tenant-management.provider.js';
import { tenantManagementExtensionsResolver } from './resolvers/extensions.resolver.js';

/**
 * The routes of the tenant management module. `AbpRouterOutlet` establishes the
 * route-level injector from `meta.providers`, and the resolver assembles the extension
 * points before the page renders.
 *
 * Meant to be lazy loaded, with `@lsw-abpvue/tenant-management/config` putting the menu
 * entries up at startup.
 *
 * @param options What the host contributes to the page
 */
export function createTenantManagementRoutes(
  options: TenantManagementConfigOptions = {},
): RouteRecordRaw[] {
  return [
    {
      path: '/tenant-management',
      component: AbpRouterOutlet,
      beforeEnter: [withResolvers([tenantManagementExtensionsResolver])],
      meta: { providers: provideTenantManagement(options), requiresAuthentication: true },
      children: [
        { path: '', redirect: '/tenant-management/tenants' },
        {
          path: 'tenants',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: TenantManagementRouteNames.Tenants,
            requiredPolicy: TenantManagementPolicyNames.Tenants,
            replaceableComponent: {
              key: TenantManagementComponents.Tenants,
              defaultComponent: TenantsPage,
            },
          },
        },
      ],
    },
  ];
}
