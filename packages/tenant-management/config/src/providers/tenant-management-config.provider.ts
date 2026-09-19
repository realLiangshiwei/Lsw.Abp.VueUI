import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { TenantManagementPolicyNames } from '../enums/policy-names.js';
import { TenantManagementRouteNames } from '../enums/route-names.js';

/**
 * The module's menu entries, registered at startup. This entry point holds no pages and
 * imports no component, so an application that never opens tenant management still gets
 * the menu for a few hundred bytes (design 03 §2).
 */
export function provideTenantManagementConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          name: TenantManagementRouteNames.TenantManagement,
          parentName: ThemeSharedRouteNames.Administration,
          requiredPolicy: TenantManagementPolicyNames.TenantManagement,
          iconClass: 'bi bi-people',
          layout: LayoutType.application,
          order: 2,
        },
        {
          path: '/tenant-management/tenants',
          name: TenantManagementRouteNames.Tenants,
          parentName: TenantManagementRouteNames.TenantManagement,
          requiredPolicy: TenantManagementPolicyNames.Tenants,
          order: 1,
        },
      ]);
    }),
  ]);
}
