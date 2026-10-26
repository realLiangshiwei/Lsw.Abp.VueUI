import type { RouteRecordRaw } from 'vue-router';
import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import {
  TextTemplateManagementPolicyNames as Policy,
  TextTemplateManagementRouteNames as Names,
} from '@lsw-abpvue/text-template-management/config';
import InlineTemplateContentPage from './components/InlineTemplateContentPage.vue';
import TemplateContentsPage from './components/TemplateContentsPage.vue';
import TextTemplatesPage from './components/TextTemplatesPage.vue';
import { TextTemplateManagementComponents as Keys } from './enums/components.js';
import { textTemplateManagementGuard } from './guards/text-template-management.guard.js';
import { provideTextTemplateManagement } from './providers/text-template-management.provider.js';
import { textTemplateManagementExtensionsResolver } from './resolvers/extensions.resolver.js';
import type { TextTemplateManagementConfigOptions } from './tokens/extensions.token.js';

export function createTextTemplateManagementRoutes(
  options: TextTemplateManagementConfigOptions = {},
): RouteRecordRaw[] {
  return [
    {
      path: '/text-template-management',
      component: AbpRouterOutlet,
      children: [
        { path: '', redirect: '/text-template-management/text-templates' },
        {
          path: 'text-templates',
          component: AbpRouterOutlet,
          beforeEnter: [
            textTemplateManagementGuard,
            withResolvers([textTemplateManagementExtensionsResolver]),
          ],
          meta: {
            providers: provideTextTemplateManagement(options),
            requiresAuthentication: true,
            requiredPolicy: Policy.TextTemplates,
          },
          children: [
            {
              path: '',
              component: AbpReplaceableRouteContainer,
              meta: {
                title: Names.TextTemplates,
                replaceableComponent: {
                  key: Keys.TextTemplates,
                  defaultComponent: TextTemplatesPage,
                },
              },
            },
            {
              path: 'contents',
              component: AbpRouterOutlet,
              meta: {
                title: 'TextTemplateManagement::Contents',
                requiredPolicy: Policy.EditContents,
              },
              children: [
                {
                  path: 'inline/:name',
                  component: AbpReplaceableRouteContainer,
                  meta: {
                    replaceableComponent: {
                      key: Keys.InlineTemplateContent,
                      defaultComponent: InlineTemplateContentPage,
                    },
                  },
                },
                {
                  path: ':name',
                  component: AbpReplaceableRouteContainer,
                  meta: {
                    replaceableComponent: {
                      key: Keys.TemplateContents,
                      defaultComponent: TemplateContentsPage,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
