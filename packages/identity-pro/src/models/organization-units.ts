export const OrganizationUnitPolicies = {
  Default: 'AbpIdentity.OrganizationUnits',
  ManageOU: 'AbpIdentity.OrganizationUnits.ManageOU',
  ManageMembers: 'AbpIdentity.OrganizationUnits.ManageMembers',
  ManageRoles: 'AbpIdentity.OrganizationUnits.ManageRoles',
} as const;

export const OrganizationUnitComponentKeys = {
  Units: 'Identity.OrganizationUnitsComponent',
  Members: 'Identity.OrganizationMembersComponent',
  Roles: 'Identity.OrganizationRolesComponent',
} as const;
