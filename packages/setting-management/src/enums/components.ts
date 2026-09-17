/**
 * The component keys ABP's Angular setting management module uses, verbatim, so a host
 * that replaced the page there replaces the same one here.
 */
export const SettingManagementComponents = {
  SettingManagement: 'SettingManagement.SettingManagementComponent',
} as const;

export type SettingManagementComponent =
  (typeof SettingManagementComponents)[keyof typeof SettingManagementComponents];
