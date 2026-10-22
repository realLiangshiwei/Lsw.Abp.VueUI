import { IdentityRouteNames as BaseIdentityRouteNames } from '@lsw-abpvue/identity/config';

export const IdentityProRouteNames = {
  ...BaseIdentityRouteNames,
  ClaimTypes: 'AbpIdentity::ClaimTypes',
  OrganizationUnits: 'AbpIdentity::OrganizationUnits',
  SecurityLogs: 'AbpIdentity::SecurityLogs',
} as const;

export type IdentityProRouteName =
  (typeof IdentityProRouteNames)[keyof typeof IdentityProRouteNames];
