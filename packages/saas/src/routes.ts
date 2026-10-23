import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import { SaasPolicyNames, SaasRouteNames } from '@lsw-abpvue/saas/config';
import type { RouteRecordRaw } from 'vue-router';
import EditionsPage from './components/EditionsPage.vue';
import TenantsPage from './components/TenantsPage.vue';
import { SaasComponents } from './enums/components.js';
import type { SaasConfigOptions } from './models/config-options.js';
import { provideSaas } from './providers/saas.provider.js';
import { saasExtensionsResolver } from './resolvers/extensions.resolver.js';

/** Creates the SaaS routes with page replacements and application contributions. */
export function createSaasRoutes(options: SaasConfigOptions = {}): RouteRecordRaw[] {
  return [
    {
      path: '/saas',
      component: AbpRouterOutlet,
      beforeEnter: [withResolvers([saasExtensionsResolver])],
      meta: {
        providers: provideSaas(options),
        requiresAuthentication: true,
        requiredPolicy: SaasPolicyNames.Saas,
      },
      children: [
        { path: '', redirect: '/saas/tenants' },
        {
          path: 'tenants',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: SaasRouteNames.Tenants,
            requiredPolicy: SaasPolicyNames.Tenants,
            replaceableComponent: { key: SaasComponents.Tenants, defaultComponent: TenantsPage },
          },
        },
        {
          path: 'editions',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: SaasRouteNames.Editions,
            requiredPolicy: SaasPolicyNames.Editions,
            replaceableComponent: { key: SaasComponents.Editions, defaultComponent: EditionsPage },
          },
        },
      ],
    },
  ];
}
