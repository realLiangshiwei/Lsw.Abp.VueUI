/**
 * The component keys ABP's Angular identity module uses, verbatim. A configuration
 * written against `@abp/ng.identity` names the same strings, which is what makes it
 * portable (design 05).
 */
export const IdentityComponents = {
  Roles: 'Identity.RolesComponent',
  Users: 'Identity.UsersComponent',
} as const;

export type IdentityComponent = (typeof IdentityComponents)[keyof typeof IdentityComponents];
