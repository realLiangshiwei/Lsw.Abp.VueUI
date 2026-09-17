/**
 * The ids of the tabs this module puts on the settings page. They are localization keys
 * as well, which is the convention `SettingTab.name` follows.
 */
export const SettingManagementTabNames = {
  EmailSettingGroup: 'AbpSettingManagement::Menu:Emailing',
  TimeZoneSettingGroup: 'AbpSettingManagement::Menu:TimeZone',
} as const;

export type SettingManagementTabName =
  (typeof SettingManagementTabNames)[keyof typeof SettingManagementTabNames];
