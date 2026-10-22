import { IdentityPolicyNames as BaseIdentityPolicyNames } from '@lsw-abpvue/identity/config';

export const IdentityProPolicyNames = {
  ...BaseIdentityPolicyNames,
  IdentityManagement:
    'AbpIdentity.Roles || AbpIdentity.Users || AbpIdentity.ClaimTypes || AbpIdentity.OrganizationUnits || AbpIdentity.SecurityLogs',
  OrganizationUnits: 'AbpIdentity.OrganizationUnits',
  OrganizationUnitsManageOU: 'AbpIdentity.OrganizationUnits.ManageOU',
  OrganizationUnitsManageMembers: 'AbpIdentity.OrganizationUnits.ManageMembers',
  OrganizationUnitsManageRoles: 'AbpIdentity.OrganizationUnits.ManageRoles',
  SecurityLogs: 'AbpIdentity.SecurityLogs',
  Sessions: 'AbpIdentity.Sessions',
  SettingManagement: 'AbpIdentity.SettingManagement',
  UsersChangeHistory: 'AuditLogging.ViewChangeHistory:Volo.Abp.Identity.IdentityUser',
  RolesChangeHistory: 'AuditLogging.ViewChangeHistory:Volo.Abp.Identity.IdentityRole',
  ClaimTypes: 'AbpIdentity.ClaimTypes',
  ClaimTypesCreate: 'AbpIdentity.ClaimTypes.Create',
  ClaimTypesUpdate: 'AbpIdentity.ClaimTypes.Update',
  ClaimTypesDelete: 'AbpIdentity.ClaimTypes.Delete',
  UsersViewDetails: 'AbpIdentity.Users.ViewDetails',
  UsersExport: 'AbpIdentity.Users.Export',
  UsersImport: 'AbpIdentity.Users.Import',
  UsersImpersonation: 'AbpIdentity.Users.Impersonation',
  UsersManageRoles: 'AbpIdentity.Users.Update.ManageRoles',
  UsersManageOU: 'AbpIdentity.Users.Update.ManageOU',
} as const;

export type IdentityProPolicyName =
  (typeof IdentityProPolicyNames)[keyof typeof IdentityProPolicyNames];
