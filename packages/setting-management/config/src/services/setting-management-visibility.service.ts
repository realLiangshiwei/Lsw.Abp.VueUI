import {
  defineService,
  FeatureService,
  inject,
  onServiceDestroy,
  RoutesService,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, watch } from 'vue';
import { SettingManagementFeatures } from '../enums/features.js';
import { SettingManagementRouteNames } from '../enums/route-names.js';
import { SettingTabsService } from './setting-tabs.service.js';

/**
 * Keeps the settings entry out of the menu while there is nothing behind it -- either
 * because the feature is off for this tenant, or because no tab survived the permission
 * check. A menu entry that leads to an empty page is worse than no entry.
 */
export const SettingManagementVisibilityService = defineService(
  'SettingManagementVisibilityService',
  () => {
    const tabs = inject(SettingTabsService);
    const routes = inject(RoutesService);
    const enabled = inject(FeatureService).isEnabled(SettingManagementFeatures.Enable);

    const shown = computed(() => enabled.value && tabs.visible.value.length > 0);

    let stop: (() => void) | null = null;
    onServiceDestroy(() => {
      stop?.();
      stop = null;
    });

    return {
      /** Applies it now and after every change to either side. The initializer calls it. */
      init: (): void => {
        stop ??= watch(
          shown,
          visible => {
            routes.patch(SettingManagementRouteNames.Settings, { invisible: !visible });
          },
          { immediate: true },
        );
      },
    };
  },
);
export type SettingManagementVisibilityService = ServiceOf<
  typeof SettingManagementVisibilityService
>;
