import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import {
  OpenIddictProPolicyNames as Policy,
  OpenIddictProRouteNames as Names,
} from '@lsw-abpvue/openiddict-pro/config';
import type { RouteRecordRaw } from 'vue-router';
import ApplicationsPage from './components/ApplicationsPage.vue';
import ScopesPage from './components/ScopesPage.vue';
import { OpenIddictProComponents as Keys } from './enums/components.js';
import { provideOpenIddictPro } from './providers/openiddict-pro.provider.js';
import { openIddictProExtensionsResolver } from './resolvers/extensions.resolver.js';
import type { OpenIddictProConfigOptions } from './tokens/extensions.token.js';

/** Creates the official routes with typed contributions and replaceable pages. */
export function createOpenIddictProRoutes(
  options: OpenIddictProConfigOptions = {},
): RouteRecordRaw[] {
  return [
    {
      path: '/openiddict',
      component: AbpRouterOutlet,
      beforeEnter: withResolvers([openIddictProExtensionsResolver]),
      meta: { providers: provideOpenIddictPro(options), requiresAuthentication: true },
      children: [
        { path: '', redirect: '/openiddict/Applications' },
        ...(
          [
            ['Applications', Policy.Application, ApplicationsPage],
            ['Scopes', Policy.Scope, ScopesPage],
          ] as const
        ).map(([name, requiredPolicy, defaultComponent]) => ({
          path: name,
          component: AbpReplaceableRouteContainer,
          meta: {
            title: Names[name],
            requiredPolicy,
            replaceableComponent: { key: Keys[name], defaultComponent },
          },
        })),
      ],
    },
  ];
}
