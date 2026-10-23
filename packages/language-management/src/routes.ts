import {
  AbpReplaceableRouteContainer,
  AbpRouterOutlet,
  withResolvers,
} from '@lsw-abpvue/core/router';
import {
  LanguageManagementPolicyNames as Policy,
  LanguageManagementRouteNames as Names,
} from '@lsw-abpvue/language-management/config';
import type { RouteRecordRaw } from 'vue-router';
import LanguageTextsPage from './components/LanguageTextsPage.vue';
import LanguagesPage from './components/LanguagesPage.vue';
import { LanguageManagementComponents as Keys } from './enums/components.js';
import { languageManagementGuard } from './guards/language-management.guard.js';
import { provideLanguageManagement } from './providers/language-management.provider.js';
import { languageManagementExtensionsResolver } from './resolvers/extensions.resolver.js';
import type { LanguageManagementConfigOptions } from './tokens/extensions.token.js';

/** Creates language routes with typed contributions and replaceable pages. */
export function createLanguageManagementRoutes(
  options: LanguageManagementConfigOptions = {},
): RouteRecordRaw[] {
  return [
    {
      path: '/language-management',
      component: AbpRouterOutlet,
      beforeEnter: [languageManagementGuard, withResolvers([languageManagementExtensionsResolver])],
      meta: {
        providers: provideLanguageManagement(options),
        requiresAuthentication: true,
        requiredPolicy: Policy.LanguageManagement,
      },
      children: [
        { path: '', redirect: '/language-management/languages' },
        {
          path: 'languages',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: Names.Languages,
            requiredPolicy: Policy.Languages,
            replaceableComponent: { key: Keys.Languages, defaultComponent: LanguagesPage },
          },
        },
        {
          path: 'texts',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: Names.LanguageTexts,
            requiredPolicy: Policy.LanguageTexts,
            replaceableComponent: { key: Keys.LanguageTexts, defaultComponent: LanguageTextsPage },
          },
        },
      ],
    },
  ];
}
