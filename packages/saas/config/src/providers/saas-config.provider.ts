import {
  AuthErrorFilterService,
  ConfigStateService,
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { defineAsyncComponent } from 'vue';
import { SaasPolicyNames } from '../enums/policy-names.js';
import { SaasAuthFilterNames, SaasRouteNames, SaasSettingTabNames } from '../enums/route-names.js';

/** Registers SaaS navigation, host settings and the impersonation error filter. */
export function provideSaasConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const config = inject(ConfigStateService);
      inject(RoutesService).add([
        {
          path: '/saas',
          name: SaasRouteNames.Saas,
          layout: LayoutType.application,
          iconClass: 'bi bi-buildings',
          order: 99,
          requiredPolicy: SaasPolicyNames.Saas,
        },
        ...(['Tenants', 'Editions'] as const).map((name, index) => ({
          path: `/saas/${name.toLowerCase()}`,
          name: SaasRouteNames[name],
          parentName: SaasRouteNames.Saas,
          requiredPolicy: SaasPolicyNames[name],
          order: index + 1,
        })),
      ]);
      inject(SettingTabsService).add([
        {
          name: SaasSettingTabNames.SaasManagement,
          order: 100,
          requiredPolicy: SaasPolicyNames.SettingManagement,
          visible: () => !config.snapshot().currentTenant.id,
          component: defineAsyncComponent(() => import('../components/SaasSettings.vue')),
        },
      ]);
      inject(AuthErrorFilterService).add({
        id: SaasAuthFilterNames.Impersonation,
        executable: true,
        execute: error => {
          const raw = error.raw;
          return (
            error.error?.data?.['grant_type'] === SaasAuthFilterNames.Impersonation ||
            (!!raw &&
              typeof raw === 'object' &&
              'grant_type' in raw &&
              raw.grant_type === SaasAuthFilterNames.Impersonation)
          );
        },
      });
    }),
  ]);
}
