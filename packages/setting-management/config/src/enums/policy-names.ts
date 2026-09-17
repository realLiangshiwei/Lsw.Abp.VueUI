/** The permission names the setting management module checks. */
export const SettingManagementPolicyNames = {
  Emailing: 'SettingManagement.Emailing',
  EmailingTest: 'SettingManagement.Emailing.Test',
  TimeZone: 'SettingManagement.TimeZone',
} as const;

export type SettingManagementPolicyName =
  (typeof SettingManagementPolicyNames)[keyof typeof SettingManagementPolicyNames];
