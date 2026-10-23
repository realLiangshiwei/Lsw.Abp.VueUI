import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  onServiceDestroy,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { watch } from 'vue';
import {
  LanguageManagementPolicyNames as Policy,
  LanguageManagementRouteNames as Names,
} from '../enums/route-names.js';
import { LANGUAGE_MANAGEMENT_FEATURES } from '../tokens/features.token.js';

/** Registers language navigation and keeps it in sync with the current tenant's feature. */
export function provideLanguageManagementConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const routes = inject(RoutesService);
      const features = inject(LANGUAGE_MANAGEMENT_FEATURES);
      routes.add([
        {
          name: Names.LanguageManagement,
          path: '/language-management',
          parentName: ThemeSharedRouteNames.Administration,
          requiredPolicy: Policy.LanguageManagement,
          layout: LayoutType.application,
          iconClass: 'bi bi-globe',
          order: 4,
        },
        {
          name: Names.Languages,
          path: '/language-management/languages',
          parentName: Names.LanguageManagement,
          requiredPolicy: Policy.Languages,
          order: 1,
        },
        {
          name: Names.LanguageTexts,
          path: '/language-management/texts',
          parentName: Names.LanguageManagement,
          requiredPolicy: Policy.LanguageTexts,
          order: 2,
        },
      ]);
      onServiceDestroy(
        watch(
          features,
          value => {
            routes.patch(Names.LanguageManagement, { invisible: !value.enable });
          },
          { immediate: true, flush: 'sync' },
        ),
      );
    }),
  ]);
}
