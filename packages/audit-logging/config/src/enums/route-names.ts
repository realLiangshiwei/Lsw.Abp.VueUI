export const AuditLoggingRouteNames = {
  AuditLogging: 'AbpAuditLogging::Menu:AuditLogging',
} as const;

export const AuditLoggingPolicyNames = {
  AuditLogging: 'AuditLogging.AuditLogs',
  Export: 'AuditLogging.AuditLogs.Export',
  SettingManagement: 'AuditLogging.AuditLogs.SettingManagement',
} as const;

export const AuditLoggingSettingTabNames = AuditLoggingRouteNames;
export type AuditLoggingPolicyName =
  (typeof AuditLoggingPolicyNames)[keyof typeof AuditLoggingPolicyNames];
