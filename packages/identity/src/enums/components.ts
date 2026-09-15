/**
 * The component keys ABP's Angular identity module uses, verbatim, so a configuration
 * written against `@abp/ng.identity` -- a replaced page, a contributor keyed by one of
 * these -- moves over unchanged.
 */
export const IdentityComponents = {
  Roles: 'Identity.RolesComponent',
  Users: 'Identity.UsersComponent',
} as const;

export type IdentityComponent = (typeof IdentityComponents)[keyof typeof IdentityComponents];
