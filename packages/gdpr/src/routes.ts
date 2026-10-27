import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import type { RouteRecordRaw } from 'vue-router';
import AbpGdprPage from './components/AbpGdprPage.vue';
import { GdprComponents } from './enums/components.js';
import { provideGdpr } from './providers/gdpr.provider.js';
import { gdprExtensionsResolver } from './resolvers/extensions.resolver.js';
import type { GdprConfigOptions } from './tokens/extensions.token.js';

export function createGdprRoutes(options: GdprConfigOptions = {}): RouteRecordRaw[] {
  return [
    {
      path: '/gdpr',
      component: AbpRouterOutlet,
      beforeEnter: withResolvers([gdprExtensionsResolver]),
      meta: { requiresAuthentication: true, providers: provideGdpr(options) },
      children: [
        {
          path: '',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: 'AbpGdpr::PersonalData',
            replaceableComponent: {
              key: GdprComponents.PersonalData,
              defaultComponent: AbpGdprPage,
            },
          },
        },
      ],
    },
  ];
}
