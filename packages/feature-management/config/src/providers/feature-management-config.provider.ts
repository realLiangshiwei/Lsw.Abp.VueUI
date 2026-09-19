import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { SettingTabsService } from '@lsw-abpvue/setting-management/config';
import { defineAsyncComponent } from 'vue';
import { FeatureManagementPolicyNames } from '../enums/policy-names.js';
import { FeatureManagementTabNames } from '../enums/tab-names.js';

/**
 * The tab this module puts on the settings page, from which the host's own features are
 * managed. The dialog behind it arrives when the tab is opened.
 */
export function provideFeatureManagementConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(SettingTabsService).add([
        {
          name: FeatureManagementTabNames.FeatureManagement,
          requiredPolicy: FeatureManagementPolicyNames.ManageHostFeatures,
          order: 300,
          component: defineAsyncComponent(() => import('../components/FeatureManagementTab.vue')),
        },
      ]);
    }),
  ]);
}
