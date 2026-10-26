import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  onServiceDestroy,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import {
  TEXT_TEMPLATE_MANAGEMENT_FEATURES,
  TextTemplateManagementRouteNames as Names,
} from '@lsw-abpvue/text-template-management/common';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { watch } from 'vue';
import { TextTemplateManagementPolicyNames as Policy } from '../enums/policy-names.js';

/** Registers text template navigation and its current tenant's feature visibility. */
export function provideTextTemplateManagementConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const routes = inject(RoutesService);
      const features = inject(TEXT_TEMPLATE_MANAGEMENT_FEATURES);
      routes.add([
        {
          name: Names.TextTemplates,
          path: '/text-template-management/text-templates',
          parentName: ThemeSharedRouteNames.Administration,
          requiredPolicy: Policy.TextTemplates,
          layout: LayoutType.application,
          iconClass: 'bi bi-envelope-open',
          order: 6,
        },
      ]);
      onServiceDestroy(
        watch(features, value => routes.patch(Names.TextTemplates, { invisible: !value.enable }), {
          immediate: true,
          flush: 'sync',
        }),
      );
    }),
  ]);
}
