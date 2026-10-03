import {
  ConfigStateService,
  FeatureService,
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ThemeSharedRouteNames } from '@lsw-abpvue/theme-shared';
import { defineAsyncComponent } from 'vue';
import { SettingManagementFeatures } from '../enums/features.js';
import { SettingManagementPolicyNames } from '../enums/policy-names.js';
import { SettingManagementRouteNames } from '../enums/route-names.js';
import { SettingManagementTabNames } from '../enums/tab-names.js';
import { SettingManagementVisibilityService } from '../services/setting-management-visibility.service.js';
import { SettingTabsService } from '../services/setting-tabs.service.js';
import { AccountSettingsService } from '../services/account-settings.service.js';

/**
 * The menu entry and the tabs this module brings, registered at startup. The tab
 * components are asked for when a tab is opened rather than imported here, which is what
 * keeps this entry point to the size design 03 §2 asks of it.
 */
export function provideSettingManagementConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          path: '/setting-management',
          name: SettingManagementRouteNames.Settings,
          parentName: ThemeSharedRouteNames.Administration,
          layout: LayoutType.application,
          iconClass: 'bi bi-gear',
          order: 100,
        },
      ]);

      const configState = inject(ConfigStateService);
      const accountSettings = inject(AccountSettingsService);
      const feature = inject(FeatureService);
      const mayChangeEmail = feature.isEnabled(
        SettingManagementFeatures.AllowChangingEmailSettings,
      );

      inject(SettingTabsService).add([
        {
          name: SettingManagementTabNames.EmailSettingGroup,
          requiredPolicy: SettingManagementPolicyNames.Emailing,
          order: 100,
          component: defineAsyncComponent(() => import('../components/EmailSettingsTab.vue')),
          // The endpoints behind this tab check the feature, but only inside a tenant.
          visible: () =>
            configState.getOne('currentTenant').value.id == null || mayChangeEmail.value,
        },
        {
          name: SettingManagementTabNames.AccountSettingGroup,
          order: 150,
          component: defineAsyncComponent(() => import('../components/AccountSettingsTab.vue')),
          requiredPolicy:
            accountSettings.requiredPolicy ??
            (accountSettings.update ? 'AbpAccount.SettingManagement' : undefined),
          visible: () => configState.snapshot().currentUser.isAuthenticated,
        },
        {
          name: SettingManagementTabNames.TimeZoneSettingGroup,
          requiredPolicy: SettingManagementPolicyNames.TimeZone,
          order: 200,
          component: defineAsyncComponent(() => import('../components/TimeZoneSettingsTab.vue')),
          // A backend whose clock is not UTC has one time zone and no choice to offer.
          visible: () => configState.getOne('clock').value.kind === 'Utc',
        },
      ]);

      inject(SettingManagementVisibilityService).init();
    }),
  ]);
}
