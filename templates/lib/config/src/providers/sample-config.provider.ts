import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { SamplePolicyNames } from '../enums/policy-names.js';
import { SampleRouteNames } from '../enums/route-names.js';

/**
 * The module's menu entries, registered at startup. This entry point holds no pages and
 * imports no component, so an application that never opens the module still gets its
 * menu for a few hundred bytes (design 03 §2).
 */
export function provideSampleConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          path: '/sample',
          name: SampleRouteNames.Sample,
          requiredPolicy: SamplePolicyNames.Sample,
          iconClass: 'bi bi-box',
          layout: LayoutType.application,
          order: 100,
        },
      ]);
    }),
  ]);
}
