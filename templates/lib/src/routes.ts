import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import { SamplePolicyNames, SampleRouteNames } from '@lsw-abpvue/template-lib/config';
import type { RouteRecordRaw } from 'vue-router';
import SamplePage from './components/SamplePage.vue';
import { SampleComponents } from './enums/components.js';
import type { SampleConfigOptions } from './models/config-options.js';
import { provideSample } from './providers/sample.provider.js';
import { sampleExtensionsResolver } from './resolvers/extensions.resolver.js';

/**
 * The module's routes. `AbpRouterOutlet` establishes the route-level injector from
 * `meta.providers`, and the resolver assembles the extension points before the page
 * renders. Meant to be lazy loaded, with the `/config` entry point putting the menu
 * entries up at startup.
 *
 * @param options What the host contributes to the page
 */
export function createSampleRoutes(options: SampleConfigOptions = {}): RouteRecordRaw[] {
  return [
    {
      path: '/sample',
      component: AbpRouterOutlet,
      beforeEnter: [withResolvers([sampleExtensionsResolver])],
      meta: { providers: provideSample(options), requiresAuthentication: true },
      children: [
        {
          path: '',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: SampleRouteNames.Sample,
            requiredPolicy: SamplePolicyNames.Sample,
            replaceableComponent: {
              key: SampleComponents.Sample,
              defaultComponent: SamplePage,
            },
          },
        },
      ],
    },
  ];
}
