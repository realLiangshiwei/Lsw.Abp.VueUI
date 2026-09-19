import type { AbpNavTab } from '@lsw-abpvue/core';

/**
 * One tab of the settings page. A module with something to configure registers one of
 * these instead of replacing the page.
 *
 * @see `ABP.Tab` in `@abp/ng.core`
 */
export type SettingTab = AbpNavTab;
