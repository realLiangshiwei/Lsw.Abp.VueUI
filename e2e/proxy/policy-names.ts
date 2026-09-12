// The permission names the backend declares, so a check is a name the compiler knows
// rather than a string that quietly answers no when it is misspelled. Grouped the way
// the backend groups them, and covering every module it declares rather than only the
// ones generated here -- permissions are not filed per module anywhere it states them.
//
// To have a mistyped name stop compiling, merge the union into core once, anywhere in
// the application:
//
//   declare module '@lsw-abpvue/core' {
//     interface AbpKnownPolicyName extends Record<AbpIdentityPolicyName, true> {}
//   }
//
// Merging nothing is fine: `isGranted` keeps taking any string until something is
// merged in.

export const AbpIdentityPolicyNames = {
  Roles: 'AbpIdentity.Roles',
  RolesCreate: 'AbpIdentity.Roles.Create',
  RolesDelete: 'AbpIdentity.Roles.Delete',
  RolesManagePermissions: 'AbpIdentity.Roles.ManagePermissions',
  RolesUpdate: 'AbpIdentity.Roles.Update',
  Users: 'AbpIdentity.Users',
  UsersCreate: 'AbpIdentity.Users.Create',
  UsersDelete: 'AbpIdentity.Users.Delete',
  UsersManagePermissions: 'AbpIdentity.Users.ManagePermissions',
  UsersUpdate: 'AbpIdentity.Users.Update',
  UsersUpdateManageRoles: 'AbpIdentity.Users.Update.ManageRoles',
} as const;

export type AbpIdentityPolicyName =
  (typeof AbpIdentityPolicyNames)[keyof typeof AbpIdentityPolicyNames];

export const AbpTenantManagementPolicyNames = {
  Tenants: 'AbpTenantManagement.Tenants',
  TenantsCreate: 'AbpTenantManagement.Tenants.Create',
  TenantsDelete: 'AbpTenantManagement.Tenants.Delete',
  TenantsManageConnectionStrings: 'AbpTenantManagement.Tenants.ManageConnectionStrings',
  TenantsManageFeatures: 'AbpTenantManagement.Tenants.ManageFeatures',
  TenantsUpdate: 'AbpTenantManagement.Tenants.Update',
} as const;

export type AbpTenantManagementPolicyName =
  (typeof AbpTenantManagementPolicyNames)[keyof typeof AbpTenantManagementPolicyNames];

export const BookStorePolicyNames = {
  Files: 'BookStore.Files',
  FilesUpload: 'BookStore.Files.Upload',
} as const;

export type BookStorePolicyName = (typeof BookStorePolicyNames)[keyof typeof BookStorePolicyNames];

export const FeatureManagementPolicyNames = {
  ManageHostFeatures: 'FeatureManagement.ManageHostFeatures',
} as const;

export type FeatureManagementPolicyName =
  (typeof FeatureManagementPolicyNames)[keyof typeof FeatureManagementPolicyNames];

export const SettingManagementPolicyNames = {
  Emailing: 'SettingManagement.Emailing',
  EmailingTest: 'SettingManagement.Emailing.Test',
  TimeZone: 'SettingManagement.TimeZone',
} as const;

export type SettingManagementPolicyName =
  (typeof SettingManagementPolicyNames)[keyof typeof SettingManagementPolicyNames];
