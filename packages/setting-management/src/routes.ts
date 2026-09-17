import { AbpReplaceableRouteContainer, AbpRouterOutlet } from '@lsw-abpvue/core/router';
import { SettingManagementRouteNames } from '@lsw-abpvue/setting-management/config';
import type { RouteRecordRaw } from 'vue-router';
import SettingsPage from './components/SettingsPage.vue';
import { SettingManagementComponents } from './enums/components.js';

/**
 * The route of the settings page. It carries no `requiredPolicy` of its own: what may be
 * seen is decided per tab, and the menu entry is hidden when none of them survives.
 *
 * Meant to be lazy loaded, with `@lsw-abpvue/setting-management/config` putting the menu
 * entry and the module's own tabs up at startup.
 */
export function createSettingManagementRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '/setting-management',
      component: AbpRouterOutlet,
      meta: { requiresAuthentication: true },
      children: [
        {
          path: '',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: SettingManagementRouteNames.Settings,
            replaceableComponent: {
              key: SettingManagementComponents.SettingManagement,
              defaultComponent: SettingsPage,
            },
          },
        },
      ],
    },
  ];
}
