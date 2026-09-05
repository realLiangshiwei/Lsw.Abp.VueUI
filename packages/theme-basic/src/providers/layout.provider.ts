import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  ReplaceableComponentsService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { NavItemsService } from '@lsw-abpvue/theme-shared';
import AbpCurrentUser from '../components/nav/AbpCurrentUser.vue';
import AbpLanguages from '../components/nav/AbpLanguages.vue';
import AbpLogo from '../components/nav/AbpLogo.vue';
import AbpNavItems from '../components/nav/AbpNavItems.vue';
import AbpRoutes from '../components/nav/AbpRoutes.vue';
import AbpThemeToggle from '../components/nav/AbpThemeToggle.vue';
import { ThemeBasicComponents } from '../enums/components.js';
import AccountLayout from '../layouts/AccountLayout.vue';
import ApplicationLayout from '../layouts/ApplicationLayout.vue';
import EmptyLayout from '../layouts/EmptyLayout.vue';

/**
 * The three layouts and the pieces they are made of, under the keys the Angular UI uses.
 * They go through `ReplaceableComponentsService` rather than being imported directly, so
 * a host swaps the sidebar or the whole shell without forking the theme.
 */
export function provideThemeBasicLayouts(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const replaceable = inject(ReplaceableComponentsService);

      for (const [key, component] of [
        [ThemeBasicComponents.ApplicationLayout, ApplicationLayout],
        [ThemeBasicComponents.AccountLayout, AccountLayout],
        [ThemeBasicComponents.EmptyLayout, EmptyLayout],
        [ThemeBasicComponents.Logo, AbpLogo],
        [ThemeBasicComponents.Routes, AbpRoutes],
        [ThemeBasicComponents.NavItems, AbpNavItems],
      ] as const) {
        replaceable.add({ key, component });
      }
    }),

    provideAppInitializer(() => {
      // The two navbar entries that are components. The behavioural ones -- the profile
      // link and logging out -- come from `theme-shared`, where every theme gets them.
      inject(NavItemsService).add([
        { name: ThemeBasicComponents.ThemeToggle, order: 50, component: AbpThemeToggle },
        { name: ThemeBasicComponents.Languages, order: 100, component: AbpLanguages },
        { name: ThemeBasicComponents.CurrentUser, order: 200, component: AbpCurrentUser },
      ]);
    }),
  ]);
}
