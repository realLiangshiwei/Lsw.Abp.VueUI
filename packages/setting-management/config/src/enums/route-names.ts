/** The route names ABP's Angular setting management module uses, verbatim. */
export const SettingManagementRouteNames = {
  Settings: 'AbpSettingManagement::Settings',
} as const;

export type SettingManagementRouteName =
  (typeof SettingManagementRouteNames)[keyof typeof SettingManagementRouteNames];
