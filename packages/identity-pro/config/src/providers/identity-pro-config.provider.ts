import {
  inject,
  ConfigStateService,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { defineAsyncComponent } from 'vue';
import { IdentityProPolicyNames } from '../enums/policy-names.js';
import { IdentityProRouteNames } from '../enums/route-names.js';

/** Registers the implemented commercial identity menus without loading pages. */
export function provideIdentityProConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          name: IdentityProRouteNames.IdentityManagement,
          parentName: ThemeSharedRouteNames.Administration,
          requiredPolicy: IdentityProPolicyNames.IdentityManagement,
          iconClass: 'bi bi-person-badge',
          layout: LayoutType.application,
          order: 2,
        },
        {
          path: '/identity/organization-units',
          name: IdentityProRouteNames.OrganizationUnits,
          parentName: IdentityProRouteNames.IdentityManagement,
          requiredPolicy: IdentityProPolicyNames.OrganizationUnits,
          order: 1,
        },
        {
          path: '/identity/roles',
          name: IdentityProRouteNames.Roles,
          parentName: IdentityProRouteNames.IdentityManagement,
          requiredPolicy: IdentityProPolicyNames.Roles,
          order: 2,
        },
        {
          path: '/identity/users',
          name: IdentityProRouteNames.Users,
          parentName: IdentityProRouteNames.IdentityManagement,
          requiredPolicy: IdentityProPolicyNames.Users,
          order: 3,
        },
        {
          path: '/identity/claim-types',
          name: IdentityProRouteNames.ClaimTypes,
          parentName: IdentityProRouteNames.IdentityManagement,
          requiredPolicy: IdentityProPolicyNames.ClaimTypes,
          order: 4,
        },
        {
          path: '/identity/security-logs',
          name: IdentityProRouteNames.SecurityLogs,
          parentName: IdentityProRouteNames.IdentityManagement,
          requiredPolicy: IdentityProPolicyNames.SecurityLogs,
          order: 4,
        },
      ]);
      const config = inject(ConfigStateService);
      inject(SettingTabsService).add([
        {
          name: IdentityProRouteNames.IdentityManagement,
          order: 100,
          requiredPolicy: IdentityProPolicyNames.SettingManagement,
          component: defineAsyncComponent(() => import('../components/IdentitySettings.vue')),
          visible: () =>
            config.snapshot().multiTenancy.userSharingStrategy !== 1 ||
            !config.snapshot().currentTenant.id,
        },
      ]);
    }),
  ]);
}
