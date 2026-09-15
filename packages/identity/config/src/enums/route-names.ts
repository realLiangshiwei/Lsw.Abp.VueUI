/** The route names ABP's Angular identity module uses, verbatim. */
export const IdentityRouteNames = {
  IdentityManagement: 'AbpIdentity::Menu:IdentityManagement',
  Roles: 'AbpIdentity::Roles',
  Users: 'AbpIdentity::Users',
} as const;

export type IdentityRouteName = (typeof IdentityRouteNames)[keyof typeof IdentityRouteNames];
