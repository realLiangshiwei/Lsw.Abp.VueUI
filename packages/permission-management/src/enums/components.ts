/**
 * The component keys ABP's Angular permission management module uses, verbatim, so a
 * host that replaced the dialog there replaces the same one here.
 */
export const PermissionManagementComponents = {
  PermissionManagement: 'PermissionManagement.PermissionManagementComponent',
} as const;

export type PermissionManagementComponent =
  (typeof PermissionManagementComponents)[keyof typeof PermissionManagementComponents];
