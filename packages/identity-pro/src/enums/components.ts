import { IdentityComponents } from '@lsw-abpvue/identity';

export const IdentityProComponents = {
  ...IdentityComponents,
  Claims: 'Identity.ClaimsComponent',
  OrganizationUnits: 'Identity.OrganizationUnitsComponent',
  OrganizationMembers: 'Identity.OrganizationMembersComponent',
  OrganizationRoles: 'Identity.OrganizationRolesComponent',
  SecurityLogs: 'Identity.SecurityLogs',
} as const;

export type IdentityProComponent =
  (typeof IdentityProComponents)[keyof typeof IdentityProComponents];
