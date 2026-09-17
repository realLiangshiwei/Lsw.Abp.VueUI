import {
  createNavTree,
  defineService,
  inject,
  NAV_COMPARE_FN,
  PermissionService,
  type NavTree,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { SettingTab } from '../models/setting-tab.js';

/**
 * The tabs of the settings page, as a tree. This is the extension point of the whole
 * module: nothing else about the page is meant to be replaced.
 */
export const SettingTabsService = defineService('SettingTabsService', (): NavTree<SettingTab> => {
  const permission = inject(PermissionService);
  const sort = inject(NAV_COMPARE_FN);

  return createNavTree<SettingTab>({
    hide: tab =>
      tab.invisible === true ||
      !permission.isGranted(tab.requiredPolicy) ||
      tab.visible?.() === false,
    sort,
  });
});
export type SettingTabsService = ServiceOf<typeof SettingTabsService>;

export const useSettingTabs = (): SettingTabsService => inject(SettingTabsService);
