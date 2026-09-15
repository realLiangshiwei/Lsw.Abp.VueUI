import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { IdentityPolicyNames } from '../enums/policy-names.js';
import { IdentityRouteNames } from '../enums/route-names.js';

/**
 * The module's menu entries, registered at startup. This entry point holds no pages and
 * imports no component, so an application that never opens user management still gets
 * the menu for a few hundred bytes (design 03 §2).
 */
export function provideIdentityConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          name: IdentityRouteNames.IdentityManagement,
          parentName: ThemeSharedRouteNames.Administration,
          requiredPolicy: IdentityPolicyNames.IdentityManagement,
          iconClass: 'bi bi-person-badge',
          layout: LayoutType.application,
          order: 1,
        },
        {
          path: '/identity/roles',
          name: IdentityRouteNames.Roles,
          parentName: IdentityRouteNames.IdentityManagement,
          requiredPolicy: IdentityPolicyNames.Roles,
          order: 1,
        },
        {
          path: '/identity/users',
          name: IdentityRouteNames.Users,
          parentName: IdentityRouteNames.IdentityManagement,
          requiredPolicy: IdentityPolicyNames.Users,
          order: 2,
        },
      ]);
    }),
  ]);
}
