import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import {
  OpenIddictProPolicyNames as Policy,
  OpenIddictProRouteNames as Names,
} from '../enums/route-names.js';

/** Registers the official OpenIddict navigation entries. */
export function provideOpenIddictProConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          name: Names.Default,
          path: '/openiddict',
          parentName: ThemeSharedRouteNames.Administration,
          layout: LayoutType.application,
          iconClass: 'bi bi-person-badge',
          order: 3,
          requiredPolicy: Policy.Default,
        },
        ...(
          [
            ['Applications', Policy.Application],
            ['Scopes', Policy.Scope],
          ] as const
        ).map(([name, requiredPolicy], index) => ({
          name: Names[name],
          path: `/openiddict/${name}`,
          parentName: Names.Default,
          layout: LayoutType.application,
          order: index + 1,
          requiredPolicy,
        })),
      ]);
    }),
  ]);
}
