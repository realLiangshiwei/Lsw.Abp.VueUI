/** The feature names the setting management module is switched off by. */
export const SettingManagementFeatures = {
  Enable: 'SettingManagement.Enable',
  AllowChangingEmailSettings: 'SettingManagement.AllowChangingEmailSettings',
} as const;

export type SettingManagementFeature =
  (typeof SettingManagementFeatures)[keyof typeof SettingManagementFeatures];
