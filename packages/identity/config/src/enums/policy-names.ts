/**
 * The permission names the identity module checks. `IdentityManagement` is a policy
 * expression rather than a permission: the menu entry is there when either page is.
 */
export const IdentityPolicyNames = {
  IdentityManagement: 'AbpIdentity.Roles || AbpIdentity.Users',
  Roles: 'AbpIdentity.Roles',
  RolesCreate: 'AbpIdentity.Roles.Create',
  RolesUpdate: 'AbpIdentity.Roles.Update',
  RolesDelete: 'AbpIdentity.Roles.Delete',
  RolesManagePermissions: 'AbpIdentity.Roles.ManagePermissions',
  Users: 'AbpIdentity.Users',
  UsersCreate: 'AbpIdentity.Users.Create',
  UsersUpdate: 'AbpIdentity.Users.Update',
  UsersDelete: 'AbpIdentity.Users.Delete',
  UsersManagePermissions: 'AbpIdentity.Users.ManagePermissions',
} as const;

export type IdentityPolicyName = (typeof IdentityPolicyNames)[keyof typeof IdentityPolicyNames];
