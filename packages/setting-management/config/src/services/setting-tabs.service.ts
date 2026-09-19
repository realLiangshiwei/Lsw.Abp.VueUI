import {
  createNavTabs,
  defineService,
  inject,
  type NavTree,
  type ServiceOf,
} from '@lsw-abpvue/core';
import type { SettingTab } from '../models/setting-tab.js';

/**
 * The tabs of the settings page, as a tree. This is the extension point of the whole
 * module: nothing else about the page is meant to be replaced.
 */
export const SettingTabsService = defineService('SettingTabsService', (): NavTree<SettingTab> =>
  createNavTabs<SettingTab>(),
);
export type SettingTabsService = ServiceOf<typeof SettingTabsService>;

export const useSettingTabs = (): SettingTabsService => inject(SettingTabsService);
